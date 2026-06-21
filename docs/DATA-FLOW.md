# Data flow

This is the most important document to internalize. Glean has a clear, one-way
rule:

> **Reads come straight from Supabase (RLS-guarded). Writes always go through the
> Cloudflare Worker. Realtime keeps reads fresh by invalidating React Query.**

## 1. Authentication

`AuthProvider` owns the session:

1. On mount it calls `supabase.auth.getSession()` and subscribes to
   `onAuthStateChange`. The session is persisted in AsyncStorage by
   `supabase-js` (native auth mode, `detectSessionInUrl: false`).
2. Email/password (`signIn`, `signUp`) and Google OAuth (`signInWithGoogle`,
   via `expo-web-browser` + `expo-linking` deep link) are supported. Auth errors
   are mapped to friendly copy in `friendlyAuthError`.
3. The session's `user.id` becomes `userId`, the identity every read filter and
   every write derives from.

When a user signs up, a database trigger creates their `profiles` row. The
client also calls `/profile.ensure` on every load to self-heal accounts created
before the trigger (or after a reseed).

## 2. Reads (client → Supabase, direct)

All reads live in `AppProvider` as React Query queries, each `enabled` only when
authenticated. They use the Supabase JS client directly (RLS allows it):

| Query key | Table(s) | Notes |
| --- | --- | --- |
| `listings` | `listings` | All listings; `liveListings` filters out `fulfilled` |
| `profiles` | `profiles` | Listing counts derived client-side per author |
| `guides` | `guides` | Ordered by `sort_order` |
| `feed` | `feed_posts` (+ comments, likes, flags) | Likes/flags resolved to `likedByMe` / `flagged` |
| `events` | `events` | Ordered by date |
| `conversations` | `conversations` (+ messages) | `withUserId` = the other participant |
| `saved` | `saved_listings`, `saved_posts` | The current user's saves |
| `deals` | `deals` | Ordered newest first |
| `reads` | `conversation_reads` | Drives the unread badge |
| `hubFollows` | `hub_follows` | Followed community hubs |
| `drives` | `drives` (+ commitments) | Collection drives |

Each query maps snake_case rows into the camelCase domain models in
`types/index.ts` (e.g. `created_at` → `createdAt` in ms, `author_id` →
`authorId`). The provider then derives view models with `useMemo`:

- `liveListings` — active supply only (drops `fulfilled`), what discovery shows.
- `profiles` — enriched with per-author listing counts.
- `me` — the current user's profile.
- `unreadConversationIds` — conversations whose last message isn't mine and is
  newer than my last read.

## 3. Writes (client → Worker → Supabase)

No screen writes to Supabase directly. Every mutation in `AppProvider` is a thin
wrapper around `callApi` (`lib/api.ts`):

```
UI action → useApp().addListing(...) → callApi("/listings.create", {...})
   → POST {EXPO_PUBLIC_RORK_FUNCTIONS_URL}/listings.create
      Authorization: Bearer <user access token>
   → Cloudflare Worker: requireUser() → validate body → Supabase REST insert (caller's token)
   → { ok: true, data } → query invalidation → React Query refetch
```

`callApi` attaches the signed-in user's access token, sends JSON, and surfaces
the server's friendly error message on failure (or a network-problem message).

After a successful write, the provider calls `invalidate([...])` to mark the
affected query keys stale; React Query refetches them. Realtime (below) often
beats the manual invalidation, but both paths converge on the same fresh data.

### Idempotency

Create flows (`listings.create`, `feed.post`, `messages.send`) can carry a
`clientToken` generated once per draft by `newClientToken()`. The Worker uses an
upsert on a unique `(author/sender, client_token)` index, so a double-tap or
network retry returns the existing row instead of creating a duplicate.
Pair-keyed rows (conversations, likes, saves, commitments, reads, follows) use
the same idempotent-insert / DB-authoritative-toggle pattern.

## 4. Realtime (Supabase → client)

When authenticated, `AppProvider` opens one realtime channel (`glean-realtime`)
subscribed to `postgres_changes` on every relevant table. Each change **does not
patch state directly** — it invalidates the matching query key(s), letting React
Query refetch the canonical data:

- `messages` / `conversations` → invalidate `conversations`
- `feed_posts` / `feed_likes` / `feed_comments` / `feed_flags` → invalidate `feed`
- `listings` → invalidate `listings`, `profiles`
- `deals` → invalidate `deals`, `profiles`
- `drives` / `drive_commitments` → invalidate `drives`
- `events`, `conversation_reads`, `hub_follows` → their keys

This keeps every device in sync within a second or two without bespoke
reconciliation logic.

## 5. Putting it together — a worked example: confirming a deal

1. The counterparty taps **Confirm** in a chat.
2. `useApp().confirmDeal(dealId)` → `callApi("/deals.confirm", { dealId })`.
3. The Worker verifies the caller, then updates the deal **only if** the caller
   is the `counterparty_id` and status is still `proposed` (so no one can inflate
   their own numbers). It sets `status = confirmed` and `confirmed_at`.
4. A database trigger credits both profiles' `materials_moved_kg` and `deals`.
5. Realtime fires on `deals` (and `profiles`) → both participants' apps
   invalidate `deals` and `profiles` → the confirmed deal and updated impact
   stats appear on both sides.

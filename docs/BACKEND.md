# Backend

Glean's backend is two cooperating pieces:

1. **Supabase** (`backend/`) — Postgres, Auth, Row Level Security, Realtime.
2. **Cloudflare Worker** (`functions/`) — the validating server layer that owns
   all writes.

## Why a server layer at all?

Supabase RLS alone can authorize a write, but it can't *validate* it (lengths,
enums, ranges, cross-field rules) or return friendly errors. The Worker adds
that layer **without giving up RLS**: it forwards each request to Supabase REST
using the **caller's own access token**, so RLS still has the final say. The
Worker is defense-in-depth and UX, not a bypass.

```
client ──Bearer user token──▶ Worker ──same Bearer user token──▶ Supabase REST
                               │
                               ├─ requireUser()  (verify token → user.id)
                               ├─ validate + shape body
                               └─ map DB errors → friendly messages
```

## The Worker (`functions/index.ts` + `functions/rest.ts`)

### Request lifecycle (`index.ts`)

1. `OPTIONS` → CORS preflight; `GET /health` → liveness.
2. Look up the handler for the path; 404 if unknown, 405 if not `POST`.
3. `requireUser(env, bearer)` — verifies the token against
   `/auth/v1/user`; throws `401` if missing/expired.
4. Parse the JSON body (invalid JSON → `422`).
5. Run the handler with `{ rest, user }`.
6. Wrap the result as `{ ok: true, data }`. `HttpError`s become
   `{ ok: false, error }` with their status; anything else is a generic `500`.

### `Rest` helper (`rest.ts`)

A thin Supabase REST client, always carrying the caller's token:

- `insert` / `insertIdempotent(onConflict)` — create, with optional
  conflict-merge for retries/double-taps.
- `update(filter, patch)`, `remove(filter)`, `upsert(onConflict)`.
- `exists(filter)` — used for DB-authoritative toggles (read true state, flip).
- `select(query)` — rare server-side reads.

Validation helpers (`str`, `optStr`, `num`, `oneOf`) throw `422` with
field-specific messages and enforce max lengths, minimums and allowed enum sets
(materials, regions, event types, frequencies, units, roles, listing statuses).

### Endpoints

All are `POST` and return `{ ok, data }`.

| Path | What it does | Guard highlights |
| --- | --- | --- |
| `/profile.ensure` | Upsert the caller's profile (self-heal) | keyed on `user.id` |
| `/profile.update` | Patch name/bio/trade/region/role/avatar | filter `id=eq.user.id` |
| `/listings.create` | Create a have/need listing | idempotent via `clientToken` |
| `/listings.update` | Edit own listing | filter enforces `author_id=eq.user.id` |
| `/listings.status` | Mark active/fulfilled | own listing only |
| `/listings.delete` | Delete own listing | own listing only |
| `/deals.propose` | Propose a deal | can't deal with yourself |
| `/deals.confirm` | Confirm a deal | only counterparty, only while `proposed` |
| `/deals.decline` | Decline a deal | only counterparty, only while `proposed` |
| `/conversations.ensure` | Get-or-create a 1:1 thread | stable pair order → one thread per pair |
| `/messages.send` | Send a message + bump thread | idempotent via `clientToken` |
| `/conversations.read` | Mark thread read | upsert per (conversation, user) |
| `/feed.post` | Create a post | idempotent via `clientToken` |
| `/feed.like` | Toggle like | DB-authoritative (read then flip) |
| `/feed.comment` | Add a comment | — |
| `/feed.flag` | Flag a post for moderation | upsert per (post, user) |
| `/events.submit` | Submit an event | always starts `pending` (moderation) |
| `/drives.create` | Start a collection drive | — |
| `/drives.commit` | Commit kg to a drive | idempotent per (drive, user) |
| `/drives.uncommit` | Withdraw commitment | own commitment only |
| `/hubs.follow` | Toggle hub follow | DB-authoritative toggle |
| `/saved.listing` / `/saved.post` | Toggle saves | DB-authoritative toggle |

### Trust rules worth remembering

- **Ownership is enforced in the SQL filter**, not just RLS — e.g. listing edits
  require `author_id=eq.user.id` in the `PATCH` filter.
- **Deals can only be confirmed by the counterparty while still proposed**, so no
  one can inflate their own impact stats. A DB trigger credits both profiles on
  confirmation.
- **Events always enter a moderation queue** (`pending: true`, `status:
  "pending"`); only a moderator (service role) can approve/reject.
- **Toggles read the DB first**, so stale client state can never produce the
  wrong result under races.

## Supabase (`backend/`)

- **Auth** — native Supabase Auth (`auth.uid()`). A signup trigger creates the
  matching `profiles` row.
- **RLS** — every table is row-level protected; the client reads directly and
  the Worker writes with the user token, so RLS is always the final guard.
- **Realtime** — `postgres_changes` is enabled on the tables the client
  subscribes to (see DATA-FLOW.md).
- **Generated types** — `glean/src/integrations/supabase/types.ts` and
  `backend/types.ts` keep client and server in sync with the schema.

### Demo seeding (`SECURITY DEFINER` RPCs)

A static seed can't know *who* is signed in, and message RLS blocks inserting a
vendor's message under the current user's token. So first-open seeding is done by
three idempotent `SECURITY DEFINER` database functions keyed on `auth.uid()`,
called once per device from `AppProvider` (guarded by AsyncStorage flags):

1. `seed_demo_threads` — creates two realistic conversations between the signed-in
   user and two nearby supply vendors (pulled from live "have" listings, so names,
   materials and areas match real pools). No-ops if the user already has threads.
2. `seed_demo_deal` — adds a confirmed deal into one seeded thread so the full
   deal-confirmation flow is visible. No-ops if the user already has deals.
3. `seed_demo_fulfilled` — marks the listing tied to that confirmed deal as
   `fulfilled` so the lifecycle reads end-to-end. **Pool-safe**: only fulfills a
   listing whose area keeps ≥2 other active supply listings, so it never collapses
   a "Supply near you" pool. Idempotent.

Each is gated by a one-time AsyncStorage flag (`glean.demoThreads.v1`,
`glean.demoDeal.v1`, `glean.demoFulfilled.v1`) and wrapped in try/catch so a
skip never blocks startup.

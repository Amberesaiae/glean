# Features & screens

A tour of each feature area and the screens/flows that implement it. All screens
live under `glean/app/` (file-based routing).

## Onboarding & auth

- **`welcome.tsx`** — animated intro shown until `onboarded` is set. Ends in
  AsyncStorage flag `glean.onboarded.v1`.
- **`sign-in.tsx`** — email/password sign in & sign up plus Google OAuth.
  Friendly error mapping via `AuthProvider.friendlyAuthError`.
- **`role-setup.tsx`** — one-time role picker (collector / maker / processor /
  farmer / anchor) after first sign-in. Sets `glean.rolePicked.v1`.

The `NavigationGate` in `_layout.tsx` routes between these and the tabs based on
onboarded / authenticated / role state.

## Market (the home tab) — `app/(tabs)/index.tsx`

The materials marketplace and the most complex screen. It's intentionally a
**thin orchestrator**: all filter state and derivations live in the
`useMarket()` hook (`hooks/useMarket.ts`), and the UI is split into focused
subcomponents under `components/market/`.

- **Top row** (`MarketHeader`): collection-drive icon, **Messages** (middle, with
  unread badge), then the post (+) button.
- **Switcher**: a full-width `All / Have / Need` segmented control (green cue for
  Have, amber for Need) on its own row, with the **List / Map** view toggle
  separated so they don't fight for space.
- **Filters**: search query, material, region (16 Ghana regions).
- **List view**: `ListingCard` for individual supply/need posts; `SupplyPools`
  surfaces "Supply near you" — areas where ≥2 vendors cluster (built by
  `clusterSupply`), each opening a `ClusterSheet` of `SupplierRow`s.
- **Map view**: `market-map.tsx` plots supply using real pins or stable
  region-jittered coordinates (`coordFor`).
- Only **active** supply shows (`liveListings` excludes `fulfilled`).

### Create / manage listings
- **`post-listing.tsx`** (modal) — create a have/need listing with material,
  quantity/unit, region/area, price, recurring schedule, photo and optional map
  pin (`location-picker.tsx`, `media-picker.tsx`). Uses an idempotency token.
- **`listing/[id].tsx`** — detail view; owner can edit/mark fulfilled/delete,
  others can message or propose a deal.

## Messaging & deals

- **`inbox.tsx`** — conversation list, newest first, with unread indicators
  driven by `unreadConversationIds`.
- **`chat/[id].tsx`** — 1:1 thread. Send messages (idempotent), mark read,
  propose and confirm/decline deals inline.
- **Deals** — `proposeDeal` / `confirmDeal` / `declineDeal`. Only the
  counterparty can confirm while still proposed; confirmation credits both
  profiles' impact stats via a DB trigger.

## Feed — `app/(tabs)/feed.tsx`

Community updates. Posts can carry a material tag and a photo. Interactions:
like (DB-authoritative toggle), comment, flag for moderation, and save.
- **`compose.tsx`** (modal) — share an update (idempotent post).

## Discover (events) — `app/(tabs)/discover.tsx`

Climate events, forums and job fairs.
- **`event/[id].tsx`** — event detail.
- **`submit-event.tsx`** (modal) — submit an event; always enters a moderation
  queue (`pending`) until a moderator approves it.

## Learn (guides) — `app/(tabs)/learn.tsx`

Educational guides per material, ordered by `sort_order`, each with an icon,
eco-illustration, optional hero image, optional how-to video and sponsor.
- **`guide/[id].tsx`** — full guide reader.

## Collection drives

- **`drives.tsx`** — list of community collection drives tied to real supply
  pools, with progress toward `targetKg`.
- **`start-drive.tsx`** (modal) — organize a drive.
- Commit / uncommit kg to a drive (idempotent per user per drive).

## Profile — `app/(tabs)/profile.tsx`

The current user's identity and impact (`materialsMovedKg`, `listings`,
`deals`), plus tabbed content. The Profile tabs (`Listings / Posts / Saved`) use
the same shared `Segmented` control as the Market switcher for visual
consistency (`components/profile.tsx`, `components/ui.tsx`).
- **`profile/[id].tsx`** — public profile of any member.
- **`edit-profile.tsx`** (modal) — update name, bio, trade, region, role, avatar.
- **Hub follows** — follow community hubs (toggle).

## Cross-cutting

- **Saves** — listings and posts can be saved/unsaved (DB-authoritative toggles),
  surfaced in the Profile "Saved" tab.
- **Realtime** — every list stays live via the single `glean-realtime` channel.
- **Demo seeding** — on first open, the app seeds two conversations, a confirmed
  deal and a fulfilled listing keyed to the signed-in user (see BACKEND.md).

# Implementation log

A chronological record of the notable changes made to Glean, and the reasoning
behind each. Newest at the bottom.

## Market home layout: Have/Need toggle + Messages placement

Plan: `fix-the-have-need-toggle-move-messages-t`.

- **Un-crammed the All / Have / Need switcher.** It used to be squeezed onto the
  same row as the List/Map view toggle. The switcher now gets its own full-width
  row with comfortable height and spacing; the view toggle moved off that line so
  they no longer compete for space. Active segment keeps the colour cues (green
  for Have, amber for Need) with a roomier highlight.
- **Moved Messages to the middle of the top row.** Order is now collection-drive
  icon → Messages (with unread badge) → post (+). Consistent rounded button
  styling preserved.

## Shared `Segmented` control (consistency pass)

The Market switcher (All/Have/Need, pill style) and the Profile tabs
(Listings/Posts/Saved, underline style) were visually inconsistent and cramped.
Built one shared `Segmented` control in `components/ui.tsx` and used it in both
the Market home and the Profile screen so they read the same and have room to
breathe. Removed the now-unused local styles/components.

## Component refactor of the Market home

Applied a component-refactoring methodology to `app/(tabs)/index.tsx`, which had
grown to ~950 LOC with four components, a long filter pipeline and one giant
stylesheet.

- Extracted all filter/derivation state into a custom hook,
  **`hooks/useMarket.ts`** (query, kind, material, region, view mode, selected
  cluster; derived `filtered`, `clusters`, `pools`).
- Split the sub-components into focused files under **`components/market/`**:
  `ListingCard`, `SupplierRow`, `ClusterSheet`, `SupplyPools`, `MarketHeader`.
- Left `index.tsx` as a thin orchestrator.

## Backend-first data layer (accounts, cloud DB, validated writes)

Rebuilt Glean on real infrastructure:

- **Native Supabase Auth** with email/password + Google OAuth (`AuthProvider`).
- **Direct, RLS-guarded reads** from Supabase via React Query in `AppProvider`,
  with a single realtime channel invalidating query keys on change.
- **All writes funneled through a Cloudflare Worker** server layer
  (`functions/`), which verifies the caller, validates input, and writes via
  Supabase REST using the caller's own token (RLS stays the final guard).
- **Idempotency** for create flows (client tokens) and **DB-authoritative
  toggles** for likes/saves/follows so retries and races can't corrupt state.
- **`/profile.ensure`** self-heals profile rows on every load.

## Demo seeding keyed to the signed-in user

A static seed can't know who "you" are, and message RLS blocks writing a vendor's
message under your token. Solved with three idempotent `SECURITY DEFINER` RPCs
keyed on `auth.uid()`, each called once per device (AsyncStorage-gated) from
`AppProvider`:

1. **`seed_demo_threads`** — two realistic conversations with nearby supply
   vendors pulled from live "have" listings (names/materials/areas match real
   pools). No-ops if you already have threads.
2. **`seed_demo_deal`** — a confirmed deal in one seeded thread so the full
   deal-confirmation flow shows on first open. No-ops if you already have deals.
3. **`seed_demo_fulfilled`** — marks the listing tied to that confirmed deal as
   `fulfilled` so the lifecycle reads proposed → confirmed → listing closed.
   **Pool-safe** (won't collapse a "Supply near you" pool) and idempotent.

The home feed already hides fulfilled listings via `liveListings`.

## X-style community feed

Plan: `turn-the-feed-into-an-x-style-stream-wit`.

Rebuilt `app/(tabs)/feed.tsx` from boxed cards into an edge-to-edge stream split
by thin separators (X/Twitter style). Each post: round avatar, name + verified
badge + @handle + time on one line, full-width text, optional edge-to-edge
media, then a compact action row (comment, like, save, plus flag on community
posts) with light counts. Tapping a member opens their profile; tapping an
EcoForge post opens the EcoForge spotlight.

## Official feed moved into the real backend

Plan: `move-the-official-feed-into-the-real-bac`.

The verified org accounts and their posts used to live in a hardcoded client
file (`constants/officialFeed.ts`) with local-only `useState` likes/saves that
were lost on reload. They are now seeded as **real `profiles` + `feed_posts`
rows** (via migration), so they flow through the same Worker + Supabase path as
community posts. Likes/saves are DB-authoritative and persist. `profiles.id`
has no FK to `auth.users`, so official orgs seed cleanly as standalone profiles.

## Photo system: no-repeat home images + context-aware sourcing

Plan: `no-repeat-home-photos-smarter-context-im`.

- **`constants/photos.ts`** organises the 15 authentic recycling photos into
  per-material sets (plastics: loose / clear bales / mixed bales; metals:
  turnings / parts / pipes / bars; organic: husks / briquettes; textiles;
  general/landfill). Listings without their own photo get a **stable,
  deterministic** pick from the right set (hash of listing id), so the same
  image never repeats back-to-back and a listing always shows the same picture.
- **Backend seeding** writes real, distinct photos onto the demo supply
  listings via migration, so the variety is genuine data, not an app-side trick.
- **Web-sourced context images** were selected (with attention to what each
  actually shows) for places/orgs where none of the 15 photos fit, plus clean
  org/profile avatars so accounts read as authoritative. Duplicates were
  de-duped to canonical images.
- Feed post images and the bundled **EcoForge logo are left untouched**.

## Smooth feed scrolling

Plan: `no-repeat-home-photos-smarter-context-im` (section 6).

Fixed feed scroll jank: `PostRow` is memoized and receives an `active` flag so
the whole list no longer re-renders on like/comment/new data; inline videos
only play while on screen and pause when scrolled away; loading skeletons no
longer swap the list in and out (no layout jump on load).

## App icon (minimal mark)

Generated a minimal app icon for all variants (iOS, Android adaptive, splash,
favicons): a single amber leaf-arrow that reads as both a recycling loop and
upward growth on solid charcoal with generous negative space and no text.

## Material illustrations

Wired five clean, material-specific recycling illustrations into the
illustration system (`components/illustrations.tsx`), saved under
`assets/eco/` and registered as keys (`foodScraps`, `aluminumCan`, `petBottle`,
`reuseBag`, paper bin) so they're available app-wide via `<EcoImage name=… />`
and mapped onto the matching material categories.

## Tooling / repo

- Project is version-controlled and auto-synced to GitHub through Rork's
  managed git integration (no manual commits/pushes from the agent).

---

### How to keep this log useful
When you make a notable change, add a short section here: what changed, which
files, and the *why*. Keep the focus on decisions a future maintainer would need
to understand, not line-by-line diffs.

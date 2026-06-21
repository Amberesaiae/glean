# Data model

Domain models live in `glean/types/index.ts` (camelCase, what the UI consumes).
Database rows are snake_case; `AppProvider` maps between them on read, and the
Worker maps the other way on write. Timestamps are stored as ISO strings in the
DB and converted to **epoch milliseconds** (`number`) on the client (`toMs`).

## Shared enums

- **`MaterialKey`** (`constants/colors.ts`): `plastics | organic | metals |
  textiles | other` — each with a label, color and soft tint.
- **`Region`**: Ghana's 16 administrative regions (typed constant).
- **`UserRole`**: `collector | maker | processor | farmer | anchor`.
- **`ListingKind`**: `have | need`.
- **`ListingStatus`**: `active | fulfilled` (fulfilled drops out of discovery).
- **`SupplyFrequency`**: `daily | weekly | monthly`.
- **`DealStatus`**: `proposed | confirmed | declined`.
- **`DriveStatus`**: `open | closed`.

## Core entities

### `UserProfile` ← `profiles`
Identity + impact. `avatar` falls back to a default when null. `stats` holds
`materialsMovedKg`, `listings` (derived client-side per author) and `deals`.
Key columns: `id, name, handle, avatar_url, region, bio, trade, verified, role,
joined_year, materials_moved_kg, deals`.

### `Listing` ← `listings`
A have/need post for a material. Carries `quantity`/`unit`, `region`/`area`,
optional `pricePerUnit`, `recurring` + `frequency` (standing supply), optional
`lat`/`lng` pin, and `status`. Columns: `id, kind, title, material, quantity,
unit, region, area, description, photo, author_id, created_at, price_per_unit,
recurring, frequency, lat, lng, status`.

### `Deal` ← `deals`
A proposed/confirmed/declined exchange between `proposerId` and
`counterpartyId`, optionally tied to a `conversationId` and `listingId`. On
confirm, a trigger credits both profiles' impact stats. Columns: `id,
conversation_id, listing_id, proposer_id, counterparty_id, material, quantity,
unit, status, created_at, confirmed_at`.

### `Conversation` ← `conversations` + `messages`
A 1:1 thread. Stored with a stable `(user_a, user_b)` order so a unique index
guarantees one thread per pair. The client resolves `withUserId` (the other
participant) and `fromMe` per message. `Message`: `id, fromMe, text, createdAt`.

### `Drive` ← `drives` + `drive_commitments`
A community collection drive with a `targetKg`, `date`, `region`/`area`, and a
list of `commitments` (`driveId, userId, amountKg, confirmed`).

### `FeedPost` ← `feed_posts` (+ `feed_comments`, `feed_likes`, `feed_flags`)
A community update. The client folds likes into `likes` + `likedByMe`, flags into
`flagged`, and sorts `comments` ascending. `FeedComment`: `id, authorId, text,
createdAt`.

### `ClimateEvent` ← `events`
An event/forum/job fair with date, region, location, organizer, contact, and a
`pending` moderation flag.

### `Guide` ← `guides`
A learning article: `title, material, readMinutes, summary, body`, optional
`sponsor`, an `icon` (`GuideIconKey`) and `illustration` (`EcoKey`), plus
optional `heroImage` and `videoUrl`.

## Relationship / supporting tables

- `saved_listings`, `saved_posts` — per-user saves (toggle).
- `conversation_reads` — per (conversation, user) last-read timestamp; powers the
  unread badge.
- `hub_follows` — per-user followed community hub keys.
- `feed_likes`, `feed_comments`, `feed_flags` — feed interactions.
- `drive_commitments` — kg committed per user per drive.

## Derived view models (computed in `AppProvider`)

- `liveListings` — `listings` minus `fulfilled`.
- `pools` (via `utils/clusters.ts`) — "have" supply grouped by area/region into
  `SupplyCluster`s (vendor count, total kg, recurring flag, coordinates); pools
  are clusters with ≥2 listings, sorted by total kg.
- `me` — the current user's profile.
- `unreadConversationIds` — threads with an unread incoming message.

## Geography (`utils/clusters.ts`)

`REGION_CENTROIDS` holds rough lat/lng for each of the 16 regions. `coordFor`
returns a listing's real pin or a **stable** jittered point around its region
centroid (hashed from `area|region`) so location-less posts still sit sensibly on
the map. `clusterSupply` groups by area (falling back to region) to build the
"Supply near you" pools.

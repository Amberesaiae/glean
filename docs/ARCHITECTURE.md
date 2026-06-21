# Architecture

## The three apps

Glean is one product made of three deployable pieces, declared in `rork.json`:

| Folder | Framework | Role |
| --- | --- | --- |
| `glean/` | React Native (Expo Router) | The mobile client — all UI, reads, realtime |
| `backend/` | Supabase | Postgres database, Auth, Row Level Security, Realtime |
| `functions/` | Cloudflare Worker | The validating server layer that owns all writes |

The split is deliberate: **reads are cheap and safe** (RLS protects them, so the
client talks to Postgres directly and gets realtime for free), while **writes
are funneled through one validated choke point** (the Worker) so input is always
checked and shaped before it reaches the database.

## Mobile client tech stack

- **Expo + Expo Router** — file-based routing for native iOS, Android and web.
- **TypeScript (strict)** — explicit types throughout, `?.` / `??` for nullable values.
- **React Query (`@tanstack/react-query`)** — all server state; one shared `QueryClient`.
- **`@nkzw/create-context-hook`** — typed providers + access hooks (never bare `createContext`).
- **`@supabase/supabase-js`** — auth session + direct reads + realtime subscriptions.
- **AsyncStorage** — the Supabase session store and a few one-time local flags.
- **lucide-react-native** — icons.
- **Custom design system** — fonts, colors, and a shared component library in `components/ui.tsx`.

## Folder layout (`glean/`)

```
app/                     # Expo Router screens (file = route)
  _layout.tsx            # Root: providers, fonts, navigation gate, stack
  (tabs)/                # Tab navigator: Market, Feed, Discover, Learn, Profile
    _layout.tsx
    index.tsx            # Market home (thin orchestrator over useMarket)
    feed.tsx  discover.tsx  learn.tsx  profile.tsx
  welcome.tsx            # Onboarding intro
  sign-in.tsx            # Email/password + Google auth
  role-setup.tsx         # One-time role picker after first sign-in
  listing/[id].tsx       # Listing detail
  profile/[id].tsx       # Public profile
  event/[id].tsx  guide/[id].tsx
  chat/[id].tsx  inbox.tsx        # Messaging
  drives.tsx  start-drive.tsx     # Collection drives
  compose.tsx  post-listing.tsx   # Create flows (modals)
  submit-event.tsx  edit-profile.tsx
components/
  ui.tsx                 # Shared design-system primitives (buttons, chips, Segmented, etc.)
  market/                # Market-screen subcomponents (ListingCard, SupplierRow, ClusterSheet, SupplyPools, MarketHeader)
  profile.tsx  illustrations.tsx  location-picker.tsx  market-map.tsx
  media-picker.tsx  messages-button.tsx  splash-overlay.tsx  anchor.tsx
constants/               # colors.ts, fonts.ts, roles.ts, theme.ts
hooks/                   # useMarket.ts (Market filter/derivation state)
lib/                     # api.ts (server calls), supabase.ts (client), upload.ts, device.ts
providers/               # AuthProvider.tsx, AppProvider.tsx
src/integrations/supabase/types.ts   # Generated DB types
types/index.ts           # Domain models
utils/                   # clusters.ts (supply pooling/geo), format.ts
```

## Provider tree

Set up in `app/_layout.tsx`. **React Query is always the top-level provider**;
everything else nests inside it.

```
QueryClientProvider
└── AuthProvider          # Supabase session, sign in/up/out, current userId
    └── AppProvider       # all domain data + actions (reads via React Query, writes via callApi)
        └── GestureHandlerRootView
            ├── NavigationGate     # redirects based on onboarded / auth / role state
            ├── RootLayoutNav      # the Expo Router Stack
            └── SplashOverlay
```

- **`AuthProvider`** wraps `supabase.auth`. It exposes `userId`, `email`,
  `displayName`, `isAuthenticated`, `initializing`, and the auth actions. It
  listens to `onAuthStateChange` so the whole tree reacts to login/logout.
- **`AppProvider`** is the heart of the app. It runs every React Query read,
  subscribes to realtime, derives view models (`liveListings`, `pools`, `me`,
  `unreadConversationIds`, …) and exposes every mutation as a `callApi` wrapper.
  UI consumes it through `useApp()`.

## Navigation gate

`NavigationGate` (in `_layout.tsx`) enforces the entry flow with `router.replace`:

1. Not onboarded → `/welcome`
2. Onboarded but not signed in → `/sign-in`
3. Signed in but no role chosen → `/role-setup`
4. Otherwise → `/(tabs)`

`onboarded` and `rolePicked` are one-time flags persisted in AsyncStorage
(`glean.onboarded.v1`, `glean.rolePicked.v1`); auth state comes from the
Supabase session.

## Tabs

`app/(tabs)/_layout.tsx` defines five tabs: **Market** (`index`), **Feed**,
**Discover** (events), **Learn** (guides) and **Profile**. Active tint is the
brand sky-blue; the tab bar uses the design-system colors and fonts.

## Design system

The visual identity is intentionally **anti-greenwashing**: warm, grounded, not
the clichéd green-on-white. Defined in `constants/`:

- **Colors** (`colors.ts`) — sky-blue primary (`#1F7AE0`) + amber accent
  (`#F2A104`) on warm paper (`#FBF7F0`) with deep charcoal text. Material
  categories each have a color + soft tint (plastics=sky, organic=green,
  metals=slate, textiles=purple, other=amber).
- **Fonts** (`fonts.ts`) — Playfair Display (serif headers), Inter (sans body),
  Dancing Script (cursive accents), Space Mono (mono/numbers). Loaded via
  `expo-font` in the root layout before the app renders.
- **Regions** — Ghana's 16 administrative regions are a typed constant reused
  across forms, filters and the map.
- **Components** — `components/ui.tsx` holds the shared primitives, including the
  `Segmented` control reused by both the Market switcher and the Profile tabs so
  they stay consistent.

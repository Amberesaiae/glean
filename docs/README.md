# Glean — Documentation

Glean is a green-economy marketplace for Ghana that connects people who **have**
recoverable materials (plastics, organics, metals, textiles) with people who
**need** them — collectors, makers, processors, farmers and community anchors.
It pairs a peer-to-peer materials market with messaging, deals, collection
drives, a community feed, climate events and learning guides.

This folder documents how the whole system is built. Start here, then dive into
the focused docs:

| Doc | What it covers |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | The three apps, tech stack, folder layout, navigation, providers, design system |
| [DATA-FLOW.md](./DATA-FLOW.md) | How reads, writes, realtime and auth move through the system end to end |
| [BACKEND.md](./BACKEND.md) | The Cloudflare Worker server layer, Supabase, RLS, validation, idempotency, demo seeding |
| [DATA-MODEL.md](./DATA-MODEL.md) | Domain types, database tables and how rows map to client models |
| [FEATURES.md](./FEATURES.md) | Each feature area and the screens/flows that implement it |
| [IMPLEMENTATION-LOG.md](./IMPLEMENTATION-LOG.md) | A running log of the notable changes made so far and why |

## The one-paragraph mental model

The mobile app (Expo / React Native) **reads** data directly from Supabase
(Postgres) — guarded by Row Level Security — and listens to realtime changes to
keep itself fresh. Every **write**, however, goes through a thin Cloudflare
Worker server layer that verifies the caller, validates the input and writes
back through Supabase REST **using the caller's own token**, so RLS stays the
final guard. React Query caches reads; realtime events invalidate those caches.
A single context hook (`AppProvider`) exposes all data and actions to the UI.

```
┌──────────────┐   reads + realtime    ┌───────────────────┐
│  Expo app    │ ────────────────────▶ │     Supabase      │
│ (React       │ ◀──────────────────── │  Postgres + Auth  │
│  Native)     │                       │  + RLS + Realtime │
│              │   writes (validated)  └───────────────────┘
│              │ ──────┐                         ▲
└──────────────┘       ▼                         │ REST w/ caller token
                ┌───────────────────┐            │
                │ Cloudflare Worker │ ───────────┘
                │  (server layer)   │
                └───────────────────┘
```

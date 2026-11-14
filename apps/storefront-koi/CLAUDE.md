# Storefront (Koi) Guide

This guide covers work in `apps/storefront-koi`, the customer-facing Next.js app.

Stack: Next.js 15 (App Router, Turbopack), React 19, Tailwind v4, Base UI, cva,
react-hook-form + zod, TalkJS chat. Dev server: `bun run dev` → http://localhost:3001

## Structure

| Path | What goes there |
|---|---|
| `src/app/(main\|auth\|account)/<slug>/page.tsx` | Routes. Thin: metadata + `<Suspense>` + one section |
| `src/components/{atoms,cells,molecules,organisms,sections}` | Component tiers, smallest to largest |
| `src/lib/data/*.ts` | `'use server'` fetchers that call `sdk` and return raw Medusa/Mercur types |
| `src/lib/adapters/*.ts` | Map raw API types to the kit's presentation types (`SimpleProduct`, etc.) |
| `src/lib/helpers/*.ts` | Pure functions, each with a colocated `*.test.ts` |
| `src/const/*.ts` | Copy, config and demo data. `routes.ts` is the only place URLs are written |
| `src/types/*.ts` | Presentation types |
| `src/providers` | Cart and TalkJS context |

## Rules

### Routing and copy
- Route slugs and customer copy are **Indonesian** (`lelang`, `katalog`, `keranjang`,
  `akun/pesanan`). Keep new routes and text in Indonesian.
- Never hardcode a path. Add it to `ROUTES` or a builder in `src/const/routes.ts`
  and import it from there.

### Components
- Tiers only import downward: sections → organisms → molecules → cells → atoms.
  Atoms import no other components.
- Each component lives in `Tier/Name/Name.tsx` and is exported from the tier's
  `index.ts` barrel. Callers import from the barrel (`@/components/atoms`).
- Reuse atoms such as `Button`, `Card`, `Badge` and `Input` before you create new
  ones. Use the shared surface tokens (`@/const/surface`) and the theme colours in
  `globals.css` (`accent-ink`, `live-ink`, `gold-ink`, ...). No raw hex values.
- Variants use `cva`. Merge classes with `cn` from the `cn` package.
- Every data view handles loading, empty (`EmptyFeed`) and error states.

### Data
- Pages and components never call `sdk` directly. Go through `src/lib/data`, then
  map the result with `src/lib/adapters`.
- In Mercur, **price and stock come from offers, not products**. Use the buybox
  helpers (`lib/helpers/buybox.ts`) and `lib/adapters/product.ts`. Check the Mercur
  docs on offers before you change pricing logic.
- Cache only non-personal catalog data with `CACHE_TAGS` / `getGlobalCacheOptions`
  (`lib/data/cache-tags.ts`). Cart, order and customer data use the per-visitor
  options in `lib/data/cookies.ts`.
- When you add a catalog cache tag, also make sure the backend subscriber
  (`packages/api/src/subscribers/storefront-cache-revalidate.ts`) invalidates it.
- Format money with `lib/helpers/format-price.ts` (Rupiah, `id-ID`). Never use
  `toLocaleString()` without a locale.
- If a backend route is missing from the `sdk` types, run `bun run codegen` in
  `packages/api`. Don't work around it with `fetch` or `any`.

### Imports and tests
- Helpers and adapters import each other **with the `.ts` extension**
  (`'./format-price.ts'`). Tests run under `node --experimental-strip-types`,
  which doesn't read tsconfig paths. Never use `@/` aliases in code that a test
  imports directly.
- Tests use `node:test` + `node:assert/strict`. Put them next to the file as
  `name.test.ts`. Every new helper or adapter needs one.
- Don't add `@types/react` or React to the repo root. This app's React 19 types
  are pinned in `tsconfig.json`.

### Style
- Prettier: single quotes, semicolons, width 100, no trailing commas, sorted
  imports and Tailwind classes (`.prettierrc.js`).
- Comments explain *why*, as in the existing code.

## Demo data

Auctions (`const/auctions.ts`), live rooms (`const/live.ts`) and parts of the home
page (`const/home.ts`) are placeholders, because no auction backend exists yet.
When a real API arrives, add a `lib/data` fetcher and an adapter, then replace the
constant wholesale. Don't mix demo and real data in the same view.

## Verification

Before you hand off, run:
1. `bun run tsc`
2. `bun run test`
3. `bun run lint`
4. For UI changes, open the route on http://localhost:3001 and check the loading,
   empty and error states.

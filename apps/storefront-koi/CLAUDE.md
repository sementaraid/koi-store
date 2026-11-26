# Storefront (Koi) Guide

This guide covers work in `apps/storefront-koi`, the customer-facing Next.js app.
It also holds the **Farmer area**: farm registration, auctions and lots, bids and
winners, paid and shipped, claims and balance. What to build comes from the
active release (`docs/releases/README.md`). Farmer auth follows D-003.

Stack: Next.js 15 (App Router, Turbopack), React 19, Tailwind v4, Base UI, cva,
react-hook-form + zod. Dev server: `bun run dev` → http://localhost:3001

## Structure

| Path | What goes there |
|---|---|
| `src/app/(main\|auth\|account)/<slug>/page.tsx` | Routes. Thin: metadata + `<Suspense>` + one section |
| `@koi/ui` (`packages/ui`) | Shared primitives: Button, Card, Badge, Input, FormField, RenderIf, surface tokens |
| `src/components/{atoms,cells,molecules,organisms,sections}` | Component tiers, smallest to largest. `atoms/index.ts` re-exports the `@koi/ui` primitives |
| `src/lib/data/*.ts` | `'use server'` fetchers that call `sdk` and return raw Medusa/Mercur types |
| `src/lib/adapters/*.ts` | Map raw API types to the kit's presentation types (`SimpleProduct`, etc.) |
| `src/lib/helpers/*.ts` | Pure functions, each with a colocated `*.test.ts` |
| `src/const/*.ts` | Copy, config and demo data. `routes.ts` is the only place URLs are written |
| `src/types/*.ts` | Presentation types |
| `src/providers` | Cart context |

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
- `Button`, `Card`, `Badge`, `Input`, `FormField` and `RenderIf` live in
  **`@koi/ui`**, not in `atoms/`. Import them from `@/components/atoms` (which
  re-exports them) or from `@koi/ui`. Never copy them back into this app.
- A new primitive that the admin app could also use belongs in `packages/ui`.
  Read `packages/ui/CLAUDE.md` first. Koi-specific pieces (`LotLayout`,
  `PulseIcon`, `Stars`) stay in this app.
- Use the surface tokens from `@koi/ui/surface` and the theme colours in
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

### MVP release rules (`docs/releases/mvp/plan.md`)

The MVP has **no fixed-price checkout**. The plan puts the cart and marketplace
out of scope. Keep the existing cart and catalog pages working, but don't extend
checkout or payments unless the task says so.

Plan rules that affect this app:
- Show bidders masked, for example `Bud***23`. Never show a bidder's full name or
  number on public pages.
- Live prices **poll** every few seconds in the MVP. Don't add websockets or SSE.
- The farmer's WhatsApp and bank details are shown **only to the winner** of that
  lot. The farmer sees only the winner's name and WhatsApp.

## Where things already are (look here before searching)

| Need | Use |
|---|---|
| Typed client | `sdk` from `src/lib/client.ts`, typed by `@acme/api/_generated` |
| A route's request/response shape | Find the sdk name in `packages/api/.mercur/routes.d.ts`; it points at the route file to read |
| Customer auth headers | `getAuthHeaders()` in `lib/data/cookies.ts` (cookie `_medusa_jwt`) |
| Farmer (member) auth, D-003 | `getMemberAuthHeaders()`, `setMemberToken()` in `lib/data/cookies.ts` (cookie `_medusa_member_jwt`); `memberSignIn()` in `lib/data/member.ts`; `isTokenExpired()`, `tokenActorId()` in `lib/helpers/token.ts` |
| Seller-scoped farmer calls | Every `/vendor/*` call except `/vendor/sellers`, `/vendor/sellers/select`, `/vendor/stores`, `/vendor/feature-flags` and `/vendor/members/invites/accept` also needs the header `x-seller-id: <seller.id>` (from `getMyFarm()`). Without it, Mercur rejects the request with "x-seller-id header is required for vendor routes" (`ensureSellerMiddleware` in `@mercurjs/core`) |
| Passing headers to a call | `sdk.vendor.sellers.query({ fetchOptions: { headers, cache: 'no-store' } })`, as in `lib/data/farm.ts` |
| Guard an account page | `requireCustomer(from)` in `lib/guard.ts` |
| Money | `formatPrice()`, `formatPriceCompact()` in `lib/helpers/format-price.ts` |
| Time | `formatAgo()`, `formatDeadline()`, `formatRemaining()`, `formatClock()` in `lib/helpers/`; `date-fns` 4 is installed |
| Auth error copy | `authErrorMessage(error, fallback)` in `lib/helpers/auth-error.ts` |
| `@koi/ui` exports | `Badge`, `Button`, `Card`, `FormField`, `Input`, `Label`, `RenderIf`, plus `@koi/ui/primitives/*` (avatar, breadcrumb, dropdown-menu, empty, native-select, pagination, scroll-area, separator, sheet, tabs) |
| Multi-line text field | No primitive. Copy the bare `<textarea>` in `components/sections/AccountPage/components/ReviewForm.tsx` |
| Icons | `lucide-react` 1.55. Check a name with `ls node_modules/lucide-react/dist/esm/icons \| grep <name>` |
| Upload size | Server actions accept 40 MB (`next.config.ts`, `serverActions.bodySizeLimit`) |
| Farmer area so far | `lib/data/farm.ts`, `lib/helpers/farm-*.ts`, `components/sections/AccountPage/components/Farm.tsx`, routes `farm` and `farmHome` in `const/routes.ts` |

## Dev server and builds

The dev server and `next build` both write to `.next`. Building while the dev
server runs leaves `.next` half-built and every route returns 500.

- `bun run check` (tsc + tests + lint) is the handoff check. It doesn't need a
  build. A build adds little anyway: `next.config.ts` sets
  `typescript.ignoreBuildErrors`.
- If you do need `bun run build`, first check whether the dev server is up:
  ```bash
  curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:3001
  ```
  `000` means nothing is listening, so building is safe. Any other code means
  the dev server is running: don't build.
- To look at a route, use the same `curl` with the route path. `200` or a `307`
  redirect (to sign-in) means it renders.
- If `.next` got broken anyway, restart the dev server once
  (stop and rerun `bun run dev`), then repeat the `curl` until it answers. Don't
  hunt for processes or touch config files to force a reload.

## Verification

Before you hand off, run `bun run check` once. It runs `tsc`, the tests and
`next lint --quiet`, and fails on the first error. Use the individual scripts
only while fixing one kind of failure.

Lint has a baseline in `.eslintrc.json`: inherited files that report warnings
instead of errors. Don't add files to it. Take a file off when you fix it.

For UI changes, check the route answers with `curl` (above). If you didn't look
at the page in a browser, say so.

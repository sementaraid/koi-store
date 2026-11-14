@AGENTS.md

# Koi Store: project rules

Koi Store is an Indonesian koi **auction** platform. Farmers (`mitra`) run auctions,
and registered customers pay a join fee from a prepaid store-credit wallet, then
bid from the website or WhatsApp. Winners pay the farmer directly. Mercur 2.3.7
(Medusa 2.21.2) is used **as the backend only**. Every screen is custom.

**The product spec is `docs/mvp-plan.md`.** Read the relevant section before you
build any wallet, auction, bidding, strike, claim or admin feature. It defines the
rules: fees, the extend window, statuses, refunds and what is out of scope. If the
code and the plan disagree, say so instead of picking one silently.

These rules extend `AGENTS.md`. If they conflict, follow these rules. Each workspace
has its own `CLAUDE.md`. Read it before you change anything in that workspace.

## Workspaces

| Path | What it is | Port | Guide |
|---|---|---|---|
| `packages/api` | Mercur/Medusa backend (`@acme/api`) | 9000 | `packages/api/CLAUDE.md` |
| `packages/ui` | Shared design system (`@koi/ui`) used by both Koi apps | — | `packages/ui/CLAUDE.md` |
| `apps/storefront-koi` | Customer site plus the Farmer area. Next.js 15, React 19 | 3001 | `apps/storefront-koi/CLAUDE.md` |
| `apps/admin-koi` | Custom admin app for the admin team. Next.js 15, React 19 | 3002 | `apps/admin-koi/CLAUDE.md` |
| `apps/admin` | Mercur's built-in admin at `:9000/dashboard`. Backup for data fixes only | 7000 | `apps/admin/CLAUDE.md` |
| `apps/vendor` | Mercur's seller panel at `:9000/seller`. **Not used in the MVP** | 7001 | `apps/vendor/CLAUDE.md` |
| `apps/storefront` | Mercur's stock B2C storefront. **Reference only** | 3000 | none |

- Customer and farmer screens go in `apps/storefront-koi`. Admin screens go in
  `apps/admin-koi`. Don't build features in `apps/admin`, `apps/vendor` or
  `apps/storefront`.
- A component used by both Koi apps belongs in `packages/ui`.
- `AGENTS.md` lists the panel paths the wrong way round. In `medusa-config.ts`,
  admin is `/dashboard` and vendor is `/seller`.
- `apps/admin` and `apps/vendor` use React 18, pinned at the repo root. The Koi apps
  and `packages/ui` use React 19. Don't add React or `@types/react` to the root.

## Running the project

Development runs in Docker (`compose.yaml`): Postgres plus one `app` container that
runs `bun install && bun run dev`. Caddy, outside this repo, routes public
subdomains to the container through the external `web` network. Host ports are
bound to `127.0.0.1` only.

```bash
docker compose up
```

To run a command inside the container:

```bash
docker compose exec app bash
```

- `node_modules` live in named volumes, not on the host. Install packages **inside
  the container**. After you add a new workspace, also add its `node_modules`
  volume to both `compose.yaml` and the `Dockerfile`.
- When an env var must reach a dev server through turbo, add it to `passThroughEnv`
  in `turbo.json`. Otherwise turbo strips it.
- When a dev server is reached through a new public hostname, add the hostname to
  that app's allowed hosts (`allowedDevOrigins` in Next, `server.allowedHosts` in Vite).

## Commands

The package manager is **bun**. Don't use npm, yarn or pnpm, and don't create
other lockfiles.

| Task | Command (from the repo root unless noted) |
|---|---|
| Start everything | `bun run dev` (or `docker compose up`) |
| Build everything | `bun run build` |
| Lint everything | `bun run lint` |
| Backend route types | `cd packages/api && bun run codegen` |
| Backend tests | `cd packages/api && bun run test:unit` / `test:integration:http` / `test:integration:modules` |
| Seed koi data | `cd packages/api && bun run seed` (runs `src/scripts/seed-koi.ts`) |
| Koi app tests | `cd apps/<storefront-koi\|admin-koi> && bun run test` |
| Koi app type check | `cd apps/<storefront-koi\|admin-koi> && bun run tsc` |
| UI kit type check | `cd packages/ui && bun run tsc` |
| Panel type check | `cd apps/<admin\|vendor> && bun run build` (runs `tsc -b`) |

The root `check-types` script does nothing yet, because no workspace defines
`check-types`. Use the commands above instead.

## How the parts connect

- Both Koi apps call the backend through `@mercurjs/client`, typed by
  `@acme/api/_generated`. **After you add or change a backend route, run
  `bun run codegen` in `packages/api`.** Otherwise the apps' types go stale.
- `storefront-koi` uses store routes (`/store/*`) with the publishable key and the
  customer token. `admin-koi` uses admin routes (`/admin/*`) with an admin user
  token only. It has no publishable key.
- Backend changes reach the storefront through
  `src/subscribers/storefront-cache-revalidate.ts`, which calls the storefront's
  `/api/revalidate` route.
- Mercur CLI blocks install into the aliases in `blocks.json`: `api` installs to
  `packages/api/src`, `vendor` to `apps/vendor/src`, `admin` to `apps/admin/src`.

## Domain rules (from the plan; apply everywhere)

- Store money as **whole rupiah in integer columns**. Never use floats. Format it
  with `id-ID`.
- **Wallet transactions are append-only.** Never update or delete one. Fix a
  mistake with an `adjustment`. A balance is the sum of transactions and is never
  stored as an overwritable number.
- **Store credit only pays platform fees.** It can't pay farmers, be withdrawn or
  move between users.
- Statuses are fixed. Auction: `draft → scheduled → live → closed | cancelled`.
  Lot: `open → unsold | won → paid → shipped → delivered | claimed`.
- **The server's timestamp decides bid order.** Placing a bid locks the lot row.
  Save the winner and final price on the lot when it closes. Don't recompute them
  from bids.
- Wallet charges, joining, bidding and closing are **workflows**: all or nothing.
- Never change Mercur's or Medusa's code. Add around it.

## Docs first (Mercur / Medusa)

1. Read the bundled docs first: `node_modules/@mercurjs/docs/llms.txt`. They match
   the installed version, 2.3.7.
2. Use the `mercur` MCP server for search and the `medusa` MCP server for core
   Medusa topics: modules, workflows, links, subscribers, jobs and API routes.
   Both are configured in `.mcp.json`.
3. Follow the documented pattern. Don't invent APIs, options or file locations.
   If the docs don't cover something, say so before you improvise.
4. Never edit `node_modules` or the Mercur/Medusa packages.
5. List the doc pages you used in your final summary.

## Current state (as of milestone 1)

- **Built:** `packages/ui`, admin login and the nav skeleton in `admin-koi`, and the
  storefront catalog with facets and pagination.
- **Demo data:** auctions, live rooms and parts of the home page come from
  `apps/storefront-koi/src/const/*`. No wallet, auction, bid or moderation module
  exists in `packages/api` yet. These are milestones 2–5 in the plan.
- **Still open:** linking a customer account to a farmer (seller) account in Mercur.
  Check the Mercur docs before you build anything that depends on it.
- The workspace guides for `apps/admin` and `apps/vendor` refer to skills
  (`medusa-ui-conformance`, `admin-page-ui`, ...) that aren't installed. Those
  apps aren't used for features anyway.

## Secrets

- Never read, print or commit `.env` files. Only `.env.template` and `.env.test`
  are committed. When you add an env var, add it to the matching `.env.template`
  with a safe placeholder.
- Don't rely on the `"supersecret"` fallbacks in `medusa-config.ts` in anything new.

## Working style

- Work end to end without asking about routine decisions. Choose the option that
  matches the plan, the docs and the existing code, then list your assumptions.
- Stop and ask only before: deleting data or migrations, breaking an API contract,
  adding a paid service, changing a rule in `docs/mvp-plan.md`, or anything that
  touches money movement in a way the plan doesn't describe.
- Before you hand off, run the checks for every workspace you touched, using the
  commands table above. Don't hand off code that fails them.
- Features go **backend → codegen → frontend → qa**. A feature is done only when
  qa reports PASS. After a FAIL, allow at most 2 fix rounds, then report the
  remaining bugs.
- Final summary: files changed, API or contract changes, assumptions, doc and plan
  sections used, and how to see the change (URL and port).

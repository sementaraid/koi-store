@AGENTS.md

# Koi Store: project rules

Koi Store is an Indonesian multi-vendor koi marketplace built on Mercur 2.3.7
(Medusa 2.21.2). Buyers browse a catalog (`katalog`), join auctions (`lelang`) and
live rooms (`live`), and buy from verified breeders (`mitra`). Customer-facing copy
is Indonesian, and prices are Rupiah formatted with `id-ID`.

These rules extend `AGENTS.md`. If they conflict, follow these rules. Each workspace
also has its own `CLAUDE.md`. Read it before you change anything in that workspace.

## Workspaces

| Path | What it is | Port | Guide |
|---|---|---|---|
| `packages/api` | Medusa/Mercur backend (`@acme/api`) | 9000 | `packages/api/CLAUDE.md` |
| `apps/storefront-koi` | **The real storefront.** Next.js 15, React 19, Tailwind v4 | 3001 | `apps/storefront-koi/CLAUDE.md` |
| `apps/admin` | Operator panel, served at `localhost:9000/dashboard` (dev 7000) | 7000 | `apps/admin/CLAUDE.md` |
| `apps/vendor` | Seller panel, served at `localhost:9000/seller` (dev 7001) | 7001 | `apps/vendor/CLAUDE.md` |
| `apps/storefront` | Mercur's stock B2C storefront. **Reference only.** | 3000 | none |

- Build storefront features in `apps/storefront-koi`. Don't edit `apps/storefront`
  unless the task says so. Read it only to see how Mercur does something.
- `AGENTS.md` lists the panel paths the wrong way round. In `medusa-config.ts`,
  admin is `/dashboard` and vendor is `/seller`.
- The admin and vendor panels use React 18 (pinned at the repo root).
  `storefront-koi` uses React 19. Don't add React or `@types/react` to the root.

## Commands

The package manager is **bun**. Don't use npm, yarn or pnpm, and don't create
other lockfiles.

| Task | Command (from the repo root unless noted) |
|---|---|
| Start everything | `bun run dev` |
| Build everything | `bun run build` |
| Lint everything | `bun run lint` |
| Backend route types | `cd packages/api && bun run codegen` |
| Backend tests | `cd packages/api && bun run test:unit` / `test:integration:http` / `test:integration:modules` |
| Seed data | `cd packages/api && bun run seed` then `bun run seed:koi` |
| Storefront tests | `cd apps/storefront-koi && bun run test` |
| Storefront type check | `cd apps/storefront-koi && bun run tsc` |
| Panel type check | `cd apps/<admin\|vendor> && bun run build` (runs `tsc -b`) |

The root `check-types` script does nothing yet, because no workspace defines
`check-types`. Use the commands above instead.

## How the parts connect

- The storefront calls the backend through the typed client in
  `apps/storefront-koi/src/lib/client.ts`. Its types come from
  `@acme/api/_generated`. **After you add or change a backend route, run
  `bun run codegen` in `packages/api`.** Otherwise the storefront's types go stale.
- Changes in `packages/api` reach the storefront through
  `src/subscribers/storefront-cache-revalidate.ts`, which calls the storefront's
  `/api/revalidate` route with `REVALIDATE_SECRET`.
- Mercur CLI blocks install into the aliases in `blocks.json`: `api` installs to
  `packages/api/src`, `vendor` to `apps/vendor/src`, `admin` to `apps/admin/src`.

## Docs first (Mercur / Medusa)

1. Read the bundled docs first: `node_modules/@mercurjs/docs/llms.txt`. They match
   the installed version, 2.3.7.
2. Use the `mercur` MCP server for search and the `medusa` MCP server for core
   Medusa topics: modules, workflows, links, subscribers and API routes.
3. Follow the documented pattern. Don't invent APIs, options or file locations.
   If the docs don't cover something, say so before you improvise.
4. Never edit `node_modules` or the Mercur/Medusa packages. Extend them through
   the documented extension points.
5. List the doc pages you used in your final summary.

## Known gaps (don't treat these as finished features)

- **Auctions and live rooms are demo data.** `const/auctions.ts`, `const/live.ts`
  and `const/home.ts` hold placeholder lots so the pages render. No auction or
  bidding module exists in `packages/api` yet. Real bidding needs a backend
  module, routes and a workflow first. Then replace the constants with
  `lib/data` fetchers.
- `packages/api/.env.template` sets `STOREFRONT_REVALIDATE_URL=http://localhost:3000`,
  which is the stock storefront. Cache revalidation for `storefront-koi` needs
  port **3001**.
- `apps/storefront-koi/.env.template` still has values left over from the
  template: `NEXT_PUBLIC_DEFAULT_REGION=de`, "Fleek Marketplace", and port 3000
  for the base URL.
- The workspace guides refer to skills (`medusa-ui-conformance`,
  `admin-page-ui`, `admin-form-ui`, `admin-tab-ui`) that aren't installed in
  `.claude/skills/` yet. If a skill is missing, follow the guide's own rules.

## Secrets

- Never read, print or commit `.env` files. Only `.env.template` and `.env.test`
  are committed. When you add an env variable, add it to the matching
  `.env.template` with a safe placeholder.
- Leave `jwtSecret` and `cookieSecret` in `medusa-config.ts` as they are. Don't
  rely on their `"supersecret"` fallbacks in anything new.

## Working style

- Work end to end without asking about routine decisions. Choose the option that
  matches the docs and the existing code, then list your assumptions at the end.
- Stop and ask only before: deleting data or migrations, breaking an API
  contract, adding a paid service, or doing something that contradicts the docs.
- Before you hand off, run the checks for every workspace you touched, using the
  commands table above. Don't hand off code that fails them.
- Features go **backend → codegen → frontend → qa**. A feature is done only when
  qa reports PASS. After a FAIL, allow at most 2 fix rounds, then report the
  remaining bugs.
- Final summary: files changed, API or contract changes, assumptions, doc pages
  used, and how to see the change (URL and port).

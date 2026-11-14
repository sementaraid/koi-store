@AGENTS.md

# Koi Store: project rules

Koi Store is an Indonesian koi auction platform built on Mercur 2.3.7 (Medusa
2.21.2), used as the backend only. Every screen is custom. What the product is:
`docs/product/overview.md`.

This file holds the **engineering rules** every agent follows. **What to build**
lives in `docs/` (map: `docs/README.md`). These rules extend `AGENTS.md`; if they
conflict, follow these. Each workspace also has its own `CLAUDE.md`. Read it
before you change anything in that workspace.

## 1. Where things are

| Need | Read |
|---|---|
| What we're building now | `docs/releases/README.md` → the active release's `plan.md` |
| Which story to work on, and its acceptance criteria | That release's `stories.md` |
| Owner decisions in force | `docs/product/decisions.md` |
| Roles and Indonesian terms | `docs/product/overview.md` |
| The process from idea to shipped | `docs/README.md` |
| Mercur and Medusa APIs | `node_modules/@mercurjs/docs/llms.txt`, and the `mercur` and `medusa` MCP servers |

If code, a plan and a decision disagree, the newest decision in
`docs/product/decisions.md` wins. Report the conflict instead of picking silently.

## 2. The team

| Agent | Owns | Never does | Hands off to |
|---|---|---|---|
| Owner (human) | Scope, rules, plan approval, decisions, shipping | — | product-owner |
| `product-owner` | Release plans (drafts), stories, coverage, open questions, acceptance | Write application code; change a rule without the owner | backend / frontend |
| `backend` | `packages/api`: modules, workflows, routes, links, subscribers, jobs, migrations | Frontend code; features in `apps/admin` | frontend (with the API contract) |
| `frontend` | `apps/storefront-koi`, `apps/admin-koi`, `packages/ui` | Backend code; raw `fetch` | qa |
| `qa` | Verifying acceptance criteria, tests, bug reports with evidence | Change application code | product-owner |

**Flow for every story:** product-owner (story ready, no open question blocking
it) → backend → `bun run codegen` → frontend → qa → product-owner (accepts).
- A story is `done` only when qa reports PASS **and** the product-owner has
  checked every acceptance criterion against the evidence.
- After a qa FAIL, allow at most 2 fix rounds, then report the remaining bugs to
  the owner.
- Never build a story that is `blocked`.

**Every agent's report starts with this header:**
```
Story: US-xxx (tasks T-xxx.n)   Release: <slug>
Files changed: …
Checks run: <command> → <pass/fail lines>
Not verified: <what and why>
Docs used: <plan sections, decisions, Mercur doc pages>
```
Then add the role-specific part from your agent file. Keep it short.

## 3. Decisions every agent must know

Full text and reasons: `docs/product/decisions.md`.
- **D-002:** Admin features go only in `apps/admin-koi`, through `/admin/*`
  routes. Never add anything to `apps/admin`, and never send admins to
  `:9000/dashboard`.
- **D-003:** Farmers use Mercur's member login (option A) and `/vendor/*`
  routes. Read D-003 before any farmer or seller auth work. Don't build a custom
  customer↔seller link.
- **D-004:** No features in `apps/vendor` or `apps/storefront`.
- **D-005:** Components used by both Koi apps live in `packages/ui`.

## 4. Workspaces

| Path | What it is | Port | Guide |
|---|---|---|---|
| `packages/api` | Mercur/Medusa backend (`@acme/api`) | 9000 | `packages/api/CLAUDE.md` |
| `packages/ui` | Shared design system (`@koi/ui`) | — | `packages/ui/CLAUDE.md` |
| `apps/storefront-koi` | Customer site plus the Farmer area. Next.js 15, React 19 | 3001 | `apps/storefront-koi/CLAUDE.md` |
| `apps/admin-koi` | Admin app. Next.js 15, React 19 | 3002 | `apps/admin-koi/CLAUDE.md` |
| `apps/admin` | Mercur's admin at `:9000/dashboard`. Developer emergencies only (D-002) | 7000 | `apps/admin/CLAUDE.md` |
| `apps/vendor` | Mercur's seller panel at `:9000/seller`. Not used (D-004) | 7001 | `apps/vendor/CLAUDE.md` |
| `apps/storefront` | Mercur's stock B2C storefront. Reference only (D-004) | 3000 | none |

- `AGENTS.md` lists the panel paths the wrong way round. In `medusa-config.ts`,
  admin is `/dashboard` and vendor is `/seller`.
- `apps/admin` and `apps/vendor` use React 18, pinned at the repo root. The Koi
  apps and `packages/ui` use React 19. Don't add React or `@types/react` to the root.

## 5. Running the project

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

## 6. Commands

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

## 7. How the parts connect

- Both Koi apps call the backend through `@mercurjs/client`, typed by
  `@acme/api/_generated`. **After you add or change a backend route, run
  `bun run codegen` in `packages/api`.** Otherwise the apps' types go stale.
- `storefront-koi` uses `/store/*` (publishable key plus customer token) and, for
  farmers, `/vendor/*` (member token plus `x-seller-id`, D-003). `admin-koi` uses
  `/admin/*` with an admin user token only.
- Backend changes reach the storefront through
  `src/subscribers/storefront-cache-revalidate.ts`, which calls the storefront's
  `/api/revalidate` route.
- Mercur CLI blocks install into the aliases in `blocks.json`: `api` installs to
  `packages/api/src`, `vendor` to `apps/vendor/src`, `admin` to `apps/admin/src`.

## 8. Engineering invariants (every release)

- **Money is whole rupiah in integer columns.** Never floats. Format it with `id-ID`.
- **Ledgers are append-only.** Wallet transactions are never updated or deleted.
  A mistake is fixed with a new entry. A balance is a sum, never a stored number
  that gets overwritten.
- **Every mutation runs a workflow:** all or nothing, with compensation.
- **Concurrency:** where order matters (bids), lock the row and let the server's
  timestamp decide. Save results (winner, final price) when the action happens.
  Don't recompute them later.
- **Statuses are explicit enums**, and transitions follow the release plan.
  Don't skip states.
- Never change Mercur's or Medusa's code, or anything in `node_modules`. Add around it.

## 9. Mercur coding standard

Backend code follows `node_modules/@mercurjs/docs/content/resources/best-practices/`
(`overview`, `modules`, `workflows`, `api-routes`, `module-links`,
`subscribers-and-jobs`, `types`, `custom-fields`). Read the matching page before
you write that kind of code, and list the pages you used in your report.
- **Every mutation runs a workflow.** Routes, subscribers and jobs never write
  directly. Reads use `query.graph`.
- **Modules are thin CRUD** (`MedusaService`), registered with an exported id
  constant. No cross-module service calls, no foreign keys into another module.
  Relationships use `defineLink` in `src/links/`.
- **Routes are thin:** Zod validation, both generics typed
  (`AuthenticatedMedusaRequest<T>`, `MedusaResponse<T>`), only GET/POST/DELETE,
  identity from `req.auth_context`, never from the body.
- **Workflows:** one mutation per step, each with compensation. No
  `async`/`if`/loops in the composition function (use `transform` and `when`).
  Reuse built-in steps.
- **Subscribers and jobs:** fetch by `{ id }`, run a workflow, be idempotent,
  batch large sets.
- **Types:** no `any`. Import shipped types from `@mercurjs/types`.
- **Frontend:** the Koi apps use `@koi/ui` (not `@medusajs/ui`, whose rule in
  `frontend.mdx` applies only to Mercur's own panels). Data comes only through
  the typed `@mercurjs/client`, never raw `fetch`.
- If the docs don't cover something, say so before you improvise.

## 10. Working style (all agents)

### No assumptions, no unproven claims
- **Verify, don't assume.** Before you rely on an API, field, route, file or
  behaviour, confirm it in the code, the Mercur docs, the release plan or a
  decision. If you can't confirm it, say "not verified" and say what you checked.
- If a requirement is missing and nothing answers it, **ask**. Don't guess.
  Following an existing pattern in the codebase is not guessing.
- **Back every claim with evidence.** Never write "done", "works", "fixed" or
  "tested" without the command and its pass/fail output. Say plainly what you
  didn't run or couldn't check.
- Don't describe code you haven't read. Quote file paths and line numbers.

### Fewer back-and-forth rounds
- Read everything relevant first, then ask **all** your open questions in one
  numbered message before you start. Don't ask mid-task about anything you
  could have found out up front.
- When nothing is blocking, work end to end and report once at the end.
- Stop and ask only before: deleting data or migrations, breaking an API
  contract, adding a paid service or new dependency, changing a plan rule or a
  decision, or moving money in a way the plan doesn't describe.
- Run the checks for every workspace you touched, and fix failures before you
  hand off.

### Keep it simple
- Make the smallest change that meets the story's acceptance criteria. Nothing
  speculative: no "for later" options, flags or abstractions.
- Don't create a helper, hook, component or layer that has only one caller,
  unless an existing pattern requires it.
- Use what exists (Mercur, Medusa built-in steps, `@koi/ui`, existing helpers)
  before you write new code. No new dependencies without asking.
- Don't refactor, rename or reformat code outside the task.
- Prefer plain, readable code over clever code.

## 11. Secrets

- Never read, print or commit `.env` files. Only `.env.template` and `.env.test`
  are committed. When you add an env var, add it to the matching `.env.template`
  with a safe placeholder.
- Don't rely on the `"supersecret"` fallbacks in `medusa-config.ts` in anything new.

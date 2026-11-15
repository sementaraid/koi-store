# API Workspace Guide

This guide covers work in `packages/api`.

> **Koi Store:** follow the root `CLAUDE.md` sections 8 (engineering invariants)
> and 9 (Mercur coding standard). Admin features are `/admin/*` routes for
> `apps/admin-koi` (D-002). Farmer auth uses `/vendor/*` with the member actor
> (D-003). What to build comes from the active release in `docs/releases/`.

Read this guide when a task touches:
- custom API routes
- modules, services, models, and migrations
- workflows, links, subscribers, or jobs
- backend configuration or generated route types

## Scope

`packages/api` owns:
- Medusa backend configuration in `medusa-config.ts`
- custom code under `src/`
- route type codegen consumed through `./_generated`
- backend tests and verification commands

If `src/` does not exist yet, create only the folders needed for the feature:
- `src/api`
- `src/modules`
- `src/workflows`
- `src/links`
- `src/subscribers`
- `src/jobs`
- `src/scripts`

## Choosing the right backend surface

- Use a **route** when you need an HTTP endpoint.
- Use a **module** when you need a persistent domain model or service boundary.
- Use a **workflow** when the feature is a multi-step business process.
- Use a **link** when the feature defines a relationship across modules.
- Use a **subscriber** when the feature reacts to domain events.
- Use a **job** when the feature runs on a schedule or in the background.

## `blocks.json` relationship

Blocks installed through Mercur CLI route backend files through the `api` alias:
- `api` -> `packages/api/src`

If a block touches backend code, inspect:
- installed file locations
- required updates to `medusa-config.ts`
- whether codegen or backend tests must run afterwards

## Commands that already exist

Run these from `packages/api` unless noted otherwise:
- `dev`
- `codegen`
- `build`
- `test:integration:http`
- `test:integration:modules`
- `test:unit`

## Codegen

Run route codegen when a task changes:
- route paths
- request or response typing used by generated routes
- block-installed API routes that should surface in generated types

If a route task changes generated types, confirm `@acme/api/_generated` still makes sense for consumers.

## `medusa-config.ts`

Review `medusa-config.ts` when a task:
- adds a module
- adds module options
- needs env-driven configuration
- adds a provider, feature, or plugin-level dependency

## Verification

Run the **one changed spec** while iterating, then the **full suite once** before
hand-off. A full `test:integration:http` boots the whole app per suite (~35-45 s
× 15 suites ≈ 10 min); looping it after every edit is the single biggest waste in
this workspace.

```bash
# iterate: the name filters files
cd packages/api && bun run test:integration:http -- farm-registration
# hand off: full suite, run ALONE (see below)
cd packages/api && bun run test:integration:http
```

- `test:integration:http` for changed route behavior.
- `test:integration:modules` for module-level behavior. Run it after HTTP, never
  concurrently.
- `test:unit` passes trivially (`--passWithNoTests`, no unit specs exist).
  It is not evidence of anything.
- `codegen` when generated types changed.
- `bun x tsc --noEmit -p .` once per logical change, not after every edit.
  `bunx` does not exist in the container.
- Medusa CLI (`db:migrate`, `db:generate`) needs
  `DATABASE_URL=...koi-store?sslmode=disable` inline; the container's env URL
  has no `sslmode` and the CLI then hangs.
- Lint cannot run: no ESLint config anywhere. Don't try.

**Never run two Jest suites at once.** `integration-tests/global-setup.js`
forwards `127.0.0.1:5432` to Postgres; a second run dies with `EADDRINUSE` or
SIGTERM. If a test run is in progress, wait for it.

## Known mechanics (verified — don't re-derive)

These were each researched in the code once. Re-reading them is wasted work.

- **Jest setup.** `jest.config.js` disables Mercur's runtime patch hook under
  Jest (`MERCUR_DISABLED_PATCHES`) and applies the patches through
  `@mercurjs/core/patches/jest-transformer` instead. It also maps `htmlparser2`
  to the CJS copy in `node_modules/.bun` (test-only shim).
- **Test DB.** `global-setup.js` listens on `127.0.0.1:5432` and pipes to
  `$DB_HOST` because `@medusajs/test-utils` forces SSL for non-localhost hosts
  and the dev container's Postgres has SSL off. `.env.test` holds the DB vars.
- **Custom Fields.** Configured in `medusa-config.ts` under
  `customFields.<Entity>` (e.g. `Seller`), module
  `@mercurjs/core/modules/custom-fields`. The `<entity>_custom_fields` side
  table is created by the module loader during `medusa db:migrate` — **no
  hand-written migration**. Read
  `best-practices/custom-fields` before touching it. Write flow: an
  `additionalDataValidator` in `src/api/middlewares.ts` for the matcher, then
  a `hooks.<event>` handler that upserts with compensation.
- **Tests + custom fields.** Jest boots in `migrationOnly` mode, so the module
  loader does not run and the side table is missing. Create it in the spec's
  `beforeAll` (see `farm-registration.spec.ts`).
- **`req.disallowed` timing.** Mercur's `validateAndTransformQuery` reads and
  clears `req.disallowed` when it builds the query config. A middleware that
  sets it must run *before* that: register a **method-less** matcher (global
  middleware). A method-specific entry on a leaf path sorts after Mercur's and
  arrives too late.
- **Route rules.** Only GET/POST/DELETE. An update is `POST /:id`. Medusa's
  error mapping is `CONFLICT → 409`, `NOT_FOUND → 404`, `INVALID_DATA → 400`.
  Medusa's error handler **replaces** a 409 message with generic text, so
  clients must key on the status, not the message.
- **Locking.** `acquireLockStep`/`releaseLockStep` use the Locking module; with
  no redis configured it is in-memory and serialises **within one process**
  only. Every lock-based check has this limit (see T-090.4).
- **No decorators in services.** `apps/*-koi` type-check `packages/api/src`
  through the generated route types. A `@InjectManager`/`@MedusaContext`
  service breaks their `tsc`. Use plain `MedusaService` classes and read with
  `query.graph`.
- **File uploads.** `multer` 2.4.0 is a dependency; use memoryStorage in
  `middlewares.ts` plus `uploadFilesWorkflow`. Private files go to
  `private-uploads/` (outside the served `static/`); the store routes must
  never return a key or URL — return `has_*` booleans (D-018).
- **Dev file watcher.** `private-uploads/` and `static/` sit inside the watched
  tree, so an upload restarts the dev server. Expect a `curl 000` right after
  writing a file, and retry.
- **Koi app builds.** `next build` in the dev container only passes with
  `NODE_ENV=production`; with the default `NODE_ENV=development` the `/500` and
  `/404` prerender fails (`<Html>` outside `pages/_document`). Environment, not
  code.

If a block was installed, also verify the files landed in the expected `src/*` locations.

---
name: koi-delivery
description: Koi Store delivery cookbook for backend routes/workflows, storefront and admin screens, and qa. Use when starting any [backend], [frontend] or [qa] task in this repo, to copy the established patterns instead of re-deriving them, and to fill the task brief (docs/process/task-brief.md).
---

# Koi delivery cookbook

Read `docs/process/task-brief.md` first. It holds the brief template, the
cross-cutting checklist and the dispatch rules. This skill holds the patterns,
so a task starts from a known shape instead of a search.

## Backend (`packages/api`)

**Module**: `src/modules/<name>/{index.ts,service.ts,models/*.ts,migrations/}`
- `service.ts`: thin `MedusaService({ Model })`. No decorators, no cross-module
  calls.
- `index.ts`: export `MODULE` id constant, register in `medusa-config.ts`.
- Migration: `medusa db:generate <name>` with
  `DATABASE_URL=…koi-store?sslmode=disable` inline.
- Cross-module relation → `src/links/<a>-<b>.ts` with `defineLink`; use
  `readOnly` when no link table is wanted.

**Workflow**: `src/workflows/<verb>-<noun>.ts`
- One mutation per step, each with a compensating function.
- No `async`/`if`/`loops` in the composition function — `transform` and `when`.
- Reusable step → `src/workflows/steps/`.
- Every custom `/vendor/*` mutation starts with `validateSellerOpenStep`.

**Route**: `src/api/{admin|store|vendor}/<resource>/route.ts`
- Only `GET`, `POST`, `DELETE`. Update is `POST /:id`.
- Zod validators in the folder's `validators.ts`; both generics typed:
  `AuthenticatedMedusaRequest<T>`, `MedusaResponse<R>`.
- Identity from `req.auth_context` / `req.seller_context`, never the body.
- Reads use `query.graph` directly. Mutations call a workflow.
- If the file reads `req.seller_context`, add
  `import "…/types/seller-context"` — the Koi apps type-check these files
  through `.mercur/routes.d.ts`, whose graph otherwise misses the augmentation.
- Then `bun run codegen`.

**Spec**: `integration-tests/http/<area>.spec.ts` — one happy path per AC plus
one refusal per rule. Run `bun run test:integration:http -- <name>` ALONE.
Never two Jest runs at once (`EADDRINUSE 127.0.0.1:5432`).

## Storefront / admin screens

**Data layer** (`src/lib/data/<area>.ts`)
- Typed `@mercurjs/client` only, never raw `fetch`.
- Admin: every exported server action calls `requireAdmin(ROUTES.x)` first.
- Farmer: member token + `x-seller-id` headers from the existing helper.
- Return `{ value } | { error }`; keep `ClientError.code` (e.g.
  `insufficient_balance`); never branch on the message text.

**Helpers** (`src/lib/helpers/<area>.ts` + `.test.ts`)
- Pure logic only (formatting, mapping, validation mirrors). Tested with
  `node --experimental-strip-types --test`, no framework.

**Screen**
- Copy the queue shape from `apps/admin-koi/src/components/FarmQueue.tsx`
  (loading, empty, error, confirm, toast, cap notice) and the form shape from
  the storefront `CreateAuction.tsx`.
- `@koi/ui` components; a component shared by both Koi apps goes to
  `packages/ui` (D-005).
- Money `id-ID`; Indonesian copy.
- Gate on server state, never optimistically flip status.
- Do not add anything to `apps/admin` or `apps/vendor` (D-004).

**Check**: `cd apps/<app> && bun run check` inside `docker compose exec app`.

## QA

- Verify AC-by-AC against the story text, with `file:line` and command output.
- Run the changed specs, not the full suite; a full `test:integration:http` is
  ~10 min and runs alone.
- UI stories: render the screen once (browser or Playwright) before PASS. If
  you couldn't, say "not verified" and do not claim the AC.
- Bugs get a repro and an expected/actual pair. Do not fix application code.
- Check the cross-cutting list in the task brief; those are the recurring
  failures.

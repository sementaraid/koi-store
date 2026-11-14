# Admin App (Koi) Guide

This guide covers work in `apps/admin-koi`, the custom admin app for the admin
team. It runs on its own subdomain so admin code never reaches customers' browsers.

Stack: Next.js 15 (App Router), React 19, Tailwind v4, `@koi/ui`, react-hook-form +
zod. Dev server: `bun run dev` → http://localhost:3002

This is the only admin app (D-002). What to build comes from the active release
(`docs/releases/README.md`). In the MVP, admins approve farms, auctions and top-ups;
adjust balances; edit the fee table and the extend window; moderate bids; issue
strikes and bans; decide claim disputes. Read the matching plan section before you
build a screen.

## Structure

| Path | What goes there |
|---|---|
| `src/app/(auth)` | Public: `masuk` (sign-in page), `keluar` (sign-out route) |
| `src/app/(app)` | Everything private. `layout.tsx` calls `requireAdmin()` |
| `src/components` | App components (`Chrome`, `LoginForm`, ...) |
| `src/const/routes.ts` | Every admin URL (Indonesian paths). The full MVP map is already listed |
| `src/const/nav.ts` | The sidebar. Set an item's `ready: true` in the same commit that adds its page |
| `src/lib/data/*.ts` | `'use server'` calls to `/admin/*` and custom admin routes |
| `src/lib/guard.ts` | `requireAdmin()`, the only authorization check |
| `src/lib/cookies.ts` | Admin token in the httpOnly cookie `_koi_admin_jwt` |
| `src/lib/helpers/*.ts` | Pure functions, each with a colocated `*.test.ts` |

## Security rules (mandatory)

- **Every server action and route handler must call `requireAdmin()` itself.**
  The `(app)` layout protects page rendering, but a server action can be called
  directly with a POST and never passes through the layout. A data function that
  changes anything (approving, adjusting, banning) is a server action and must be
  guarded.
- The admin token stays in the `_koi_admin_jwt` httpOnly cookie. Never put it in
  localStorage, a client component, a URL or a log. Never reuse the storefront's
  cookie name.
- All backend calls happen on the server: server components or server actions.
  Don't add a `NEXT_PUBLIC_` backend URL, and don't call the API from the browser.
- Any `?redirect=` value goes through `lib/helpers/safe-redirect.ts`.
- Error messages on sign-in stay generic. Don't say whether the email or the
  password was wrong.
- Every screen that **moves money or punishes a user** (top-up approval,
  adjustment, fee override, strike, ban, bid removal) requires a written reason,
  and the backend saves who did it and why. The plan requires this audit trail.
- For uploaded evidence (transfer screenshots, KTP scans, unboxing videos), add
  only the backend's file origin to `images.remotePatterns`. Never use `**`.
- Today any Medusa admin user can reach every screen. If you add roles, add the
  check inside `requireAdmin()`.

## Patterns

- Use primitives from `@koi/ui` (Button, Card, Input, FormField, Badge, Label,
  `@koi/ui/primitives/*`). A new primitive the storefront could also use belongs
  in `packages/ui`.
- Interface copy is Indonesian, like the storefront.
- Show money as integer rupiah, formatted `id-ID`. Never do money maths in the
  browser. The backend workflow is the source of truth.
- Approval queues and tables handle loading, empty and error states. Destructive
  or money actions ask for confirmation before they submit.
- Helpers import each other with the `.ts` extension, because tests run under
  `node --experimental-strip-types`. Tests use `node:test` + `node:assert/strict`.

## Verification

Before you hand off, run:
1. `bun run tsc`
2. `bun run test`
3. `bun run lint`
4. For new screens: check that signing out and then opening the URL directly
   redirects to `/masuk`, and that the screen's server actions refuse a request
   with no session.

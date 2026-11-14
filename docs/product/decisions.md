# Decisions

Owner decisions that are in force. Every agent follows these. To change one, add
a new decision that **supersedes** it. Don't edit or delete an old entry, except
to mark it superseded.

The product-owner agent drafts entries. The owner approves them.

| ID | Date | Decision | Status |
|---|---|---|---|
| D-001 | 2026-11-13 | Mercur is the backend only; every screen is custom | In force |
| D-002 | 2026-11-14 | Admins use `apps/admin-koi` only, never `apps/admin` | In force |
| D-003 | 2026-11-14 | Farmer auth uses Mercur's member login (option A) | In force |
| D-004 | 2026-11-13 | `apps/vendor` unused; `apps/storefront` reference only | In force |
| D-005 | 2026-11-13 | One shared design system, `@koi/ui` | In force |
| D-006 | 2026-11-13 | WhatsApp through Qontak, no unofficial libraries | In force |
| D-007 | 2026-11-13 | Approved fee table; one category per auction | In force |

---

### D-001: Mercur is the backend only
**Decision:** Mercur 2.3.7 (Medusa 2.21.2) provides the backend: data models,
workflows, jobs, events, API routes, accounts, seller records and products.
Every screen is custom. Never change Mercur's or Medusa's code; add around it.
**Reason:** Mercur's dashboards use Medusa's design system, which can't be
redesigned without forking it.
**Source:** `docs/releases/mvp/plan.md`, Technical approach.

### D-002: Admins use `apps/admin-koi` only
**Decision:** Every admin feature gets an `/admin/*` route in `packages/api` and a
screen in `apps/admin-koi`, including data fixes. Don't add widgets, routes or
extensions to `apps/admin`, and don't send anyone there as a workaround. It stays
mounted at `/dashboard` for developer emergencies only.
**Reason:** `admin-koi` is built on `@koi/ui`, so it looks and works like the
storefront. Mercur's admin does far more than the team needs.
**Source:** Owner, commit `863f81d`.

### D-003: Farmer auth uses Mercur's member login (option A)
**Decision:** A farmer is one auth identity whose `app_metadata` holds both
`customer_id` and `member_id`. Each token covers one actor only, so the storefront
signs in at both `/auth/customer/emailpass` (for `/store/*`) and
`/auth/member/emailpass` (for `/vendor/*` plus the `x-seller-id` header), with
the same credentials.
- Farm registration: member login (a token with an empty `actor_id`), then
  `POST /vendor/sellers`. That creates the seller as `pending_approval`.
- After admin approves, the farmer logs in as a member again.
- This uses Mercur's `/vendor/*` API, not the `apps/vendor` panel.
- Don't build a custom customer↔seller link.
**Reason:** It reuses Mercur's seller and approval model. It was tested in dev
on 2026-11-14.
**Source:** Owner, commit `863f81d`.

### D-004: `apps/vendor` unused; `apps/storefront` reference only
**Decision:** Don't build features in `apps/vendor` (Mercur's seller panel) or
`apps/storefront` (Mercur's stock B2C storefront). Read `apps/storefront` only
to see how Mercur does something.
**Reason:** The Farmer area lives in `apps/storefront-koi`.
**Source:** `docs/releases/mvp/plan.md`, Frontends.

### D-005: One shared design system, `@koi/ui`
**Decision:** Primitives used by both Koi apps live in `packages/ui`.
**Reason:** One look across the storefront, the Farmer area and the admin app.
**Source:** `docs/releases/mvp/plan.md`, Frontends.

### D-006: WhatsApp through Qontak
**Decision:** The bot uses Qontak (Mekari), an official Indonesian WhatsApp
provider. Unofficial libraries aren't used.
**Reason:** Unofficial libraries risk a ban in the middle of an auction. Qontak
also gives a shared inbox, local support and IDR invoicing.
**Source:** `docs/releases/mvp/plan.md`, WhatsApp bot. Qontak's API capability is
still open (`mvp-Q12`).

### D-007: Approved fee table; one category per auction
**Decision:** The starting fee table in the MVP plan is approved, and admins can
edit it. Each auction has one category, and all its lots belong to it.
**Reason:** A buyer never pays a premium join fee for a cheap fish.
**Source:** `docs/releases/mvp/plan.md`, Fees.

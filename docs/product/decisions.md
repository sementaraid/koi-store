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
| D-008 | 2026-11-14 | Registration phone is required and is the WhatsApp number | In force |
| D-009 | 2026-11-14 | Platform bank account is an admin setting | In force |
| D-010 | 2026-11-14 | Platform settings live in a settings table | In force |
| D-011 | 2026-11-14 | Wallet created when the customer's profile is complete; one per customer, DB-enforced | In force |
| D-012 | 2026-11-14 | `wallet_transaction.amount` has no size cap (`numeric`, whole rupiah) | In force |
| D-013 | 2026-11-14 | Transactional email over SMTP with `nodemailer`; Mailpit in dev | In force |
| D-014 | 2026-11-14 | D-008 phone rule is enforced on the server too | In force |
| D-015 | 2026-11-14 | Farm rejection is final, with a reason, via Mercur's seller suspend | In force |
| D-016 | 2026-11-14 | Farm WhatsApp number is the registration phone, copied to `seller.phone` | In force |
| D-017 | 2026-11-14 | Farm registration collects KTP photo and NIK; both private | In force |
| D-018 | 2026-11-14 | Transfer screenshots are private, admin-only | In force |
| D-019 | 2026-11-15 | A balance correction never takes a balance below Rp0 | In force |

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

### D-008: Registration phone is required and is the WhatsApp number
**Decision:** The phone number a customer gives at registration is required. It
is the account's WhatsApp number, which the bot uses to link the number to the
account.
**Reason:** One number per account, with no extra linking step.
**Source:** Owner, answer to `mvp-Q1` (2026-11-14).

### D-009: Platform bank account is an admin setting
**Decision:** The platform bank account shown on the top-up page is stored as an
admin setting. Admins edit it in `apps/admin-koi`. It is not an env var or a
constant.
**Reason:** Admins can change it without a deploy.
**Source:** Owner, answer to `mvp-Q2` (2026-11-14).

### D-010: Platform settings live in a settings table
**Decision:** Platform settings (extend window, lot limit, auction length, claim
window, platform bank account) are stored in a settings table in the database,
not in env vars or config.
**Reason:** Admins edit them at runtime (`plan.md`: "Admin can change...").
**Source:** Owner, answer to `mvp-Q3` (2026-11-14).

### D-011: Wallet created when the profile is complete
**Decision:** A customer's wallet is created as soon as their profile is
complete, and never before. Each customer has exactly one wallet, enforced in
the database by a unique constraint on the wallet↔customer relation.
- **Profile complete** means `first_name`, `last_name` and `phone` are all
  non-empty. **This definition is an assumption for the owner to correct.**
  It uses the fields registration already requires
  (`apps/storefront-koi/src/components/sections/AuthPage/components/schema.ts:48-75`)
  and D-008.
- Normal sign-up requires all three fields, so the wallet is created right
  after sign-up. A customer created another way (admin, import) gets a wallet
  when the profile is filled in.
**Reason:** A wallet only exists for an account that can be contacted, and the
database (not app code) guarantees there is never a second wallet.
**Source:** Owner (2026-11-14).

### D-012: `wallet_transaction.amount` has no practical size cap
**Decision:** `wallet_transaction.amount` holds whole rupiah with no 4-byte
`integer` cap. It is stored with Medusa's `bigNumber` (an exact `numeric` column
plus a `raw_amount` companion), enforced whole by a database check
(`amount = trunc(amount)`). The API returns it as a JSON `number`. A literal
Postgres `bigint` is not used: Medusa's model DSL has no bigint type, and a raw
`int8` column hydrates as a string, which would break the response contract.
The "whole rupiah in integer columns" rule still holds: the value is always a
whole number, never a fraction.
**Reason:** Avoids a later column migration on an append-only ledger without
changing the API contract.
**Source:** Owner (2026-11-14).

### D-013: Transactional email over SMTP with `nodemailer`
**Decision:** Transactional email (first use: the password-reset email for
US-002 AC2) is sent over SMTP with `nodemailer`. It is a new dependency, approved
by the owner. In local dev, Mailpit catches all mail. Production changes only
the `SMTP_*` env vars; no email provider is chosen yet.
**Reason:** qa found that forgotten-password sent no email at all. SMTP keeps the
provider swappable without code changes.
**Source:** Owner (2026-11-14).

### D-014: D-008 phone rule is enforced on the server too
**Decision:** The registration phone (D-008) is required by the backend, not
only by the storefront form. `POST /store/customers` without a phone is
rejected.
**Reason:** qa found `POST /store/customers` accepted a customer with no phone,
so the rule could be bypassed by calling the API directly.
**Source:** Owner (2026-11-14).

### D-015: Farm rejection is final, via Mercur's seller suspend
**Decision:** Rejecting a farm registration is final and needs a reason the
farmer can see. There is no resubmission. Mercur has no reject route, so
rejection maps to `POST /admin/sellers/:id/suspend` with `reason`, which sets
`status_reason` and `rejected_at` on the seller.
- Unsuspending in Mercur moves the seller straight to `open` and skips
  approval. `apps/admin-koi` must not offer unsuspend for a rejected farm.
**Reason:** Reuses Mercur's seller model instead of a custom status.
**Source:** Owner (2026-11-14).

### D-016: Farm WhatsApp number is the registration phone
**Decision:** A farm's WhatsApp number is the customer's registration phone
(D-008). It is copied onto `seller.phone` at farm registration. The farm form
shows it prefilled and not editable.
**Reason:** One WhatsApp number per person, so the bot and winners always reach
the same number.
**Source:** Owner (2026-11-14).

### D-017: Farm registration collects KTP photo and NIK
**Decision:** Farm registration collects both the KTP photo and the KTP number
(16-digit NIK). Both are sensitive: they are stored privately and never
returned by a public route.
**Reason:** Admin can check identity against the bank account holder; the data
must never leak.
**Source:** Owner (2026-11-14).

### D-018: Transfer screenshots are private, like KTP documents
**Decision:** Top-up transfer screenshots are stored privately, not on a public
path. The customer API returns `has_screenshot: boolean`, never a URL. Only an
admin can view the image, through `GET /admin/topup-requests/:id/screenshot`
with an admin token. Production needs a private-access file provider; the local
dev file provider has no real access control.
**Reason:** A transfer proof can show a name, a bank account and an amount, so
it must be as private as the KTP (D-017).
**Source:** Owner (2026-11-14).

### D-019: A balance correction never takes a balance below Rp0
**Decision:** An admin balance correction (`adjustment`, US-013) may never take
a customer's balance below Rp0. A correction that would do so is refused with a
clear error, and nothing is written.
**Reason:** Credit only pays platform fees and can't be withdrawn (`plan.md`,
Rules), so a negative balance would be a debt the platform can't collect.
**Source:** Owner (2026-11-15).

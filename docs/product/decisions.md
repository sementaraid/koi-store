# Decisions

Owner decisions that are in force. Every agent follows these. To change one, add
a new decision that **supersedes** it. Don't edit or delete an old entry, except
to mark it superseded.

The product-owner agent drafts entries. The owner approves them.

| ID | Date | Decision | Status |
|---|---|---|---|
| D-001 | 2026-11-13 | Mercur is the backend only; every screen is custom | In force |
| D-002 | 2026-11-14 | Admins use `apps/admin-koi` only, never `apps/admin` | In force |
| D-003 | 2026-11-14 | Farmer auth uses Mercur's member login (option A) | In force; re-login bullet superseded by D-030 |
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
| D-020 | 2026-11-15 | Listing fee is checked at submission and charged at admin approval | In force |
| D-021 | 2026-11-15 | Auction rejection returns it to `draft` with a reason; no new status | Superseded by D-031 |
| D-022 | 2026-11-15 | A farmer can cancel an auction only before it starts | In force; allowed statuses superseded by D-031 |
| D-023 | 2026-11-15 | The first bid on a lot may equal OB | In force |
| D-024 | 2026-11-15 | A removed bid is marked removed, never deleted; price restored, extend kept | In force |
| D-025 | 2026-11-15 | Claim notices are on-site only in the MVP | In force |
| D-026 | 2026-11-15 | Second-bidder offers stay fully off-platform | In force |
| D-027 | 2026-11-15 | Claim status enum; closed = `confirmed` or `rejected`; 3-day auto-confirm | In force; enum superseded by D-038 |
| D-028 | 2026-11-15 | Shill-bidding view: per-farmer bidder table with two flags | In force |
| D-029 | 2026-11-15 | WhatsApp stays with Qontak; bot waits for a written quote | In force |
| D-030 | 2026-11-15 | Farmer logs in as a member again right after farm registration (supersedes D-003 re-login bullet) | In force |
| D-031 | 2026-11-15 | Auction status `pending_approval` added; submit, reject and cancel transitions (supersedes D-021) | In force |
| D-032 | 2026-11-15 | Auction fees are recomputed on every submit; an admin fee override is cleared on rejection | In force |
| D-033 | 2026-11-15 | The payer's `customer_id` is saved on the auction at submit; approval charges that wallet | In force |
| D-034 | 2026-11-15 | An admin cancel refunds every join fee, like a farmer cancel | In force |
| D-035 | 2026-11-15 | Lot status `cancelled` added: `open → cancelled`, admin only, with a reason | In force |
| D-036 | 2026-11-15 | Bids can be removed only while the lot is open; first-bid rule applies again after removals | In force |
| D-037 | 2026-11-15 | An "unpaid win" is a farmer's non-payment report, counted over all time | In force |
| D-038 | 2026-11-15 | A claim the farmer accepts is `approved` at once; `accepted` dropped from the enum | In force |

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
**Superseded in part:** the bullet "After admin approves, the farmer logs in as
a member again" is replaced by D-030 (2026-11-15). The rest stays in force.

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

### D-020: Listing fee is checked at submission and charged at admin approval
**Decision:** The listing fee is charged when the admin **approves** the
auction, using the final fee (after any admin change on that auction).
- When the farmer submits the auction for approval, the wallet balance is
  checked against the listing fee. If it's too low, the submission is refused
  with a "top up" prompt and nothing changes.
- On approval the balance is checked again and the `listing_fee` is recorded in
  the same workflow that schedules the auction. If the balance has dropped
  below the final fee, approval fails and nothing is saved.
- Nothing is charged before approval, so rejecting an auction or lowering its
  fee never needs a refund. The MVP refund rule (farmer-cancel join fees only)
  doesn't change.
**Reason:** The farmer pays only for an auction the platform accepts, at the
fee the admin settled on, without adding refunds to the MVP.
**Source:** Owner, answers to `mvp-Q4` and `mvp-Q5` (2026-11-15). How the
approval step finds the farmer's wallet: answered by D-033 (`mvp-Q24`).

### D-021: Auction rejection returns it to `draft` with a reason
**Decision:** When an admin rejects an auction, it goes back to `draft` with a
written reason that the farmer sees. The farmer fixes it and resubmits. No new
status is added: the auction enum stays `draft → scheduled → live → closed |
cancelled`.
**Reason:** The farmer can fix the auction and resubmit, and the approved
status list stays unchanged.
**Source:** Owner, answer to `mvp-Q13` (2026-11-15). How a submitted auction is
told apart from one still being edited: answered by D-031 (`mvp-Q17`).
**Superseded:** by D-031 (2026-11-15), which adds `pending_approval`.
Rejection now moves `pending_approval → draft` with the reason.

### D-022: A farmer can cancel an auction only before it starts
**Decision:** A farmer may cancel their auction only while it is `draft` or
`scheduled`. Once it is `live`, only an admin can cancel it. On a farmer
cancel, every customer who joined gets their join fee back as a `refund`, and
the listing fee is not refunded (as in `plan.md`, Cancellations).
**Reason:** Resolves the plan's conflict between "farmer cancels with refunds"
and "a lot with bids can only be cancelled by admin".
**Source:** Owner, answer to `mvp-Q9` (2026-11-15). What an admin cancel of a
live auction refunds: answered by D-034 (`mvp-Q19`).
**Superseded in part:** by D-031 (2026-11-15). A farmer may cancel while
`draft`, `pending_approval` or `scheduled`.

### D-023: The first bid on a lot may equal OB
**Decision:** The first bid on a lot may equal OB. Every later bid must be at
least current price + KB.
**Reason:** OB is the lot's starting price (`plan.md`, Pricing per lot).
**Source:** Owner, answer to `mvp-Q6` (2026-11-15).

### D-024: A removed bid is marked removed, never deleted
**Decision:** When an admin removes a mistaken bid, the bid is marked removed,
never deleted. The lot's current price goes back to the highest remaining bid,
or to OB if no bid is left. Any extend the removed bid caused stays: the end
time is never shortened.
**Reason:** Bids stay auditable, and a lot's end time never moves earlier.
**Source:** Owner, answer to `mvp-Q11` (2026-11-15). Removal after a lot
closes, and the first-bid rule after every bid is removed: answered by D-036
(`mvp-Q21`).

### D-025: Claim notices are on-site only in the MVP
**Decision:** The farmer and the admin learn about a dead-on-arrival claim on
the site only: the Farmer area and the claim queue in `apps/admin-koi`. No
WhatsApp message is sent. A WhatsApp claim template is a later idea.
**Reason:** Owner's MVP scope choice.
**Source:** Owner, answer to `mvp-Q7` (2026-11-15).

### D-026: Second-bidder offers stay fully off-platform
**Decision:** The platform records nothing about an offer to the second-highest
bidder and never reassigns the lot. The farmer reports the non-payment, which
can lead to a winner strike.
**Reason:** The sale is arranged between the farmer and the bidder, outside the
platform.
**Source:** Owner, answer to `mvp-Q8` (2026-11-15).

### D-027: Claim status enum and auto-confirm
**Decision:** Claim statuses are `open → accepted | disputed → approved |
rejected → resolved → confirmed`.
- "Closed", for the 30-day video deletion, means `confirmed` or `rejected`.
- New rule: if the winner doesn't confirm within 3 days of `resolved`, the claim
  becomes `confirmed` automatically. The existing scheduled job (the one that
  checks delivered and claim deadlines) does it.
**Reason:** Every claim reaches a closed status, so its video can be deleted.
**Source:** Owner, answer to `mvp-Q14` (2026-11-15).
**Superseded in part:** the enum is replaced by D-038 (2026-11-15), which drops
`accepted`. The closed definition and the auto-confirm stay in force.

### D-028: Shill-bidding view
**Decision:** For each farmer, the admin sees a bidder table: bidder, bid
count, lots bid on, wins, unpaid wins. A bidder is flagged when at least 50% of
their bids are on that farmer's lots, or when they have at least 2 unpaid wins
from that farmer. Flags take no automatic action; the admin bans by hand.
**Reason:** Gives the admin the patterns to spot shill bidding while keeping
bans a human decision.
**Source:** Owner, answer to `mvp-Q10` (2026-11-15). What counts as an "unpaid
win": answered by D-037 (`mvp-Q22`).

### D-029: WhatsApp stays with Qontak; the bot waits for a written quote
**Decision:** The bot stays with Qontak (D-006); Meta Cloud API direct is not
chosen. The owner gets a written Qontak quote covering price, Bot + User
tokens, webhook access, webhook retry and signature, rate limits, utility
charging inside the 24 h window, and onboarding time. The bot epic stays
blocked until the quote arrives. Owner action now: start Meta Business
verification (up to 14 business days).
**Reason:** Qontak's capability is confirmed (T-080.1); price and terms are
not.
**Source:** Owner, answer to `mvp-Q12` (2026-11-15).

### D-030: Farmer logs in as a member again right after farm registration
**Decision:** Supersedes D-003's bullet "After admin approves, the farmer logs
in as a member again". New wording: "After `POST /vendor/sellers`, the farmer
logs in as a member again to get a token for the new seller. Farmer actions
stay closed until the admin approves (`status === open`)."
**Reason:** The first member token has an empty `actor_id`, so the code needs a
fresh member login right after registration, not after approval.
**Source:** Owner, answer to `mvp-Q16` (2026-11-15).

### D-031: Auction status `pending_approval`
**Decision:** The auction enum becomes `draft → pending_approval → scheduled →
live → closed | cancelled`.
- Submit moves `draft → pending_approval`, with the D-020 balance check.
- Approval moves `pending_approval → scheduled` (D-020 charge in the same
  workflow).
- Rejection moves `pending_approval → draft` with a written reason the farmer
  sees. The farmer fixes it and resubmits.
- The admin approval queue lists only `pending_approval` auctions.
- A farmer may cancel while the auction is `draft`, `pending_approval` or
  `scheduled` (widens D-022). Once `live`, only the admin can cancel.
**Reason:** Tells a submitted auction apart from one still being edited.
**Source:** Owner, answer to `mvp-Q17` (2026-11-15). Supersedes D-021.

### D-032: Fees are recomputed on every submit
**Decision:** Each time the farmer submits an auction, its fees are recomputed
from the current fee table: listing fee = the category's listing fee × number
of lots; join fee = the category's join fee. The submit balance check uses the
recomputed listing fee. An admin fee override is cleared when the auction is
rejected; the admin applies it again at approval if it's still wanted.
- This changes the snapshot point carried forward from US-014 AC3 (US-030
  AC7): fees are fixed at the last submit, not at creation. A fee-table change
  still never alters a `scheduled` or later auction.
**Reason:** An auction fixed after rejection (new category or lot count)
carries the fee for what is actually submitted.
**Source:** Owner, answer to `mvp-Q18` (2026-11-15).

### D-033: The payer's `customer_id` is saved on the auction at submit
**Decision:** At submit, the farmer's `customer_id` is read from the member
token's `app_metadata` (mvp-Q15) and saved on the auction. Approval charges the
`listing_fee` to that customer's wallet.
- This is a field on the auction, not a customer↔seller link. D-003 holds.
**Reason:** The approve workflow runs under an admin token, which has no
farmer `customer_id`.
**Source:** Owner, answer to `mvp-Q24` (2026-11-15).

### D-034: An admin cancel refunds every join fee
**Decision:** When an admin cancels a `live` auction, every participant gets
their join fee back as a `refund`, the same as on a farmer cancel. The listing
fee is not refunded. The MVP refund rule widens to "a farmer or an admin
cancels an auction".
**Reason:** Owner's choice: an admin cancel treats joiners the same as a farmer cancel.
**Source:** Owner, answer to `mvp-Q19` (2026-11-15).

### D-035: Lot status `cancelled`
**Decision:** The lot enum gains `cancelled`: `open → cancelled`. Only an
admin can cancel a lot. The reason is saved, and the lot has no winner.
**Reason:** The lot enum had no state for a lot an admin stops (`mvp-Q20`).
**Source:** Owner, answer to `mvp-Q20` (2026-11-15).

### D-036: Bids can be removed only while the lot is open
**Decision:** An admin can remove a bid only while its lot is `open`. After
close, the fix is a lot cancel (D-035). Once bids have been removed and none is
left, the next bid may equal OB again (D-023 applies).
**Reason:** Winner and final price are saved at close and never recomputed
(CLAUDE.md §8).
**Source:** Owner, answer to `mvp-Q21` (2026-11-15).

### D-037: An "unpaid win" is a non-payment report
**Decision:** In the shill-bidding table (D-028), an "unpaid win" is a farmer's
non-payment report on that winner (US-058). Every count in the table covers all
time.
**Reason:** Owner's choice. The report is already recorded by US-058.
**Source:** Owner, answer to `mvp-Q22` (2026-11-15).

### D-038: A claim the farmer accepts is `approved` at once
**Decision:** When the farmer accepts a claim, it moves straight to `approved`.
`accepted` is dropped from the enum rather than kept as a transient state,
because a status that is never stored adds nothing. The admin decides only
disputed claims. The farmer's 3-day resolution clock starts at `approved` on
both paths. New claim enum:
`open → approved | disputed`, `disputed → approved | rejected`,
`approved → resolved → confirmed`.
- D-027's closed definition (`confirmed` or `rejected`) and the 3-day
  auto-confirm stay.
**Reason:** Admin time goes to disputes only, and one clock start serves both
paths.
**Source:** Owner, answer to `mvp-Q23` (2026-11-15). Supersedes D-027's enum.

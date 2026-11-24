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
| D-039 | 2026-11-15 | Every customer's personal data is encrypted at rest and shown masked in API results and the frontend | In force; narrow exceptions in D-040, D-044 and D-045; admin review settled by D-042; encryption scope by D-043 |
| D-040 | 2026-11-15 | A private file key may return to its own uploader's registration, never a URL or another user (clarifies D-017) | In force |
| D-041 | 2026-11-15 | Every seller suspend and every ban needs a reason (extends D-015) | In force |
| D-042 | 2026-11-15 | Admins see masked PII everywhere; a full value only through an explicit reveal, logged (answers `mvp-Q25`) | In force |
| D-043 | 2026-11-15 | Column-level encryption for NIK, bank account and phone on top of disk encryption; the wallet and top-up tables are included in US-092 (answers `mvp-Q26`) | In force |
| D-044 | 2026-11-15 | The winner of a lot sees the farmer's full bank account for that lot only, through the logged reveal (answers `mvp-Q27`) | On hold (owner re-confirmed the hold, 2026-11-20; first held 2026-11-16): the winner sees no farmer contact at all; D-059's 2026-11-17 return is superseded; US-051's built reveal stays shipped; the 2026-11-15 "farmer reveals the winner's phone" confirmation superseded by D-052 |
| D-045 | 2026-11-15 | A person sees their own full PII on their own record; every other caller, admins included, gets the mask | In force |
| D-046 | 2026-11-15 | Public pages show `scheduled`, `live` and `closed` auctions; a closed lot shows final price and sold/unsold, never the winner | In force; "masked name" clause superseded in part by D-051 |
| D-047 | 2026-11-15 | Join ships before bans; the ban check lands with strikes (US-059) | In force |
| D-048 | 2026-11-15 | Customers may join while the auction is `scheduled` or `live` | In force |
| D-049 | 2026-11-15 | Approval is refused once the auction's start time has passed | In force |
| D-050 | 2026-11-15 | A cancelled lot inside a public auction stays visible, labelled "Dibatalkan", with no price, final price, winner or bids | In force |
| D-051 | 2026-11-16 | Bidders shown as `Bud***x7` (3 letters of first name + `***` + last 2 characters of the customer id); full masked bid history on open and closed lots (supersedes D-046 in part) | In force |
| D-052 | 2026-11-16 | No phone between winner and farmer in the MVP: the winner gets only the farmer's bank account (D-044 reveal), the farmer only the winner's name; no wa.me link (answers `mvp-Q34`; supersedes D-044's phone confirmation) | In force for "no phone either way"; the farmer also gets the winner's address (D-056); the winner's bank-account part on hold with D-044 |
| D-053 | 2026-11-16 | A lot the winner never marks delivered stays `shipped`; no job, no setting in the MVP (answers `mvp-Q35`) | In force |
| D-054 | 2026-11-16 | A farm suspended after approval may still mark its already-sold lots paid and shipped; it can't create auctions or lots; a terminated farm can't (answers `mvp-Q36`) | In force |
| D-055 | 2026-11-16 | Error messages the Koi apps show verbatim are Indonesian, written on the backend, rupiah in `id-ID`; `@mercurjs/client` is not patched | In force |
| D-056 | 2026-11-16 | The farmer gets the winner's default shipping address: masked (city + province) on the sold lot, full only through a logged reveal (answers `mvp-Q37`; relaxes D-052 for the address only, never the phone) | In force |
| D-057 | 2026-11-16 | If the winner's bank reveal returns, it returns the account number and the account-holder name, both full, one audit row (answers `mvp-Q39`) | On hold with D-044 (re-confirmed 2026-11-20): intended rule; the built US-051 reveal stays shipped |
| D-058 | 2026-11-17 | The MVP pays off-platform: the winner pays the farmer directly within 1×24 h, the farmer marks the lot paid then ships; the platform holds and pays out no money (answers the payment-model question; un-parks US-056, US-058, US-059's strike and T-052.4) | In force |
| D-059 | 2026-11-17 | D-044 returns: the winner reveals the farmer's full account number and holder name through the logged reveal on their own won lot; no phone, no `wa.me` (D-052 stands) | Superseded by the owner's 2026-11-20 re-hold of D-044 (built code stays shipped; D-044 carries the current rule) |
| D-060 | 2026-11-17 | A farm suspended after approval may also accept or dispute claims on its own sold lots (ownership + not `terminated`, not `validateSellerOpenStep`); extends D-054 (answers `mvp-Q45`, option b) | In force |
| D-061 | 2026-11-17 | The farmer's live link is a nullable `auction.live_stream_url` column, written through `/vendor/auctions/:id/live-link` and admin-koi in any status but `closed`/`cancelled`, rendered as an outbound link (answers `mvp-Q43`) | In force |
| D-062 | 2026-11-20 | The phone in Medusa's address snapshots (`cart_address`, `order_address`, `fulfillment_address`, `stock_location_address`) is encrypted too; D-039/D-043 cover it (answers the US-092/T-092.1 scope question) | Drafted 2026-11-20, pending owner approval (built and verified in US-092; `mvp-Q53`) |
| D-063 | 2026-11-20 | A bid-removal reason (`POST /admin/bids/:id/remove`) is required, non-blank and at most 500 characters, the same cap as US-059's strike reason (answers `mvp-Q52`) | In force |
| D-064 | 2026-11-24 | The lot page (`/lelang/<lot>`) is the only bidding surface; the separate live room (`/lelang/<lot>/live`, US-046) is removed and old links redirect to the lot page; bid rules (D-058, join fee, extend) unchanged (answers `mvp-Q57`, option b) | In force |

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

### D-039: Personal data is encrypted at rest and masked
**Decision:** Every customer's personal data is stored encrypted at rest, and API
results and the frontend show only a small part of it, never the full value. This
covers the KTP/NIK, bank account details, phone numbers and similar PII.
- The KTP photo and transfer screenshots stay private files (D-017, D-018).
- How admins review masked PII is settled by D-042 (masked everywhere, full
  value only through a logged reveal).
- The encryption mechanism is settled by D-043 (column-level on top of disk
  encryption, wallet and top-up tables included).
- Three narrow exceptions to "never the full value": the private file key back
  to its own uploader (D-040), the winner's reveal of the farmer's bank account
  for their own winning lot (D-044), and a person's view of their own full PII
  on their own record (D-045).
- Scope of the new story: US-092 in `docs/releases/mvp/stories.md`.
**Reason:** A leak then exposes little, and staff screens never display a full
NIK, bank account or phone.
**Source:** Owner follow-up, 2026-11-15 (after US-020 acceptance).

### D-040: Private file key may return to its own uploader
**Decision:** The rule "nothing private is exposed on public routes" holds as
written in D-017. One exception is allowed and confirmed by the owner: the KTP
upload route (`POST /store/farm-uploads`, US-020 T-020.5) may return the private
file key to the customer who uploaded it, for their own farm registration.
- It never returns a URL for a private file.
- It never returns the key to any other user.
- This is the exception to `packages/api/CLAUDE.md`'s "store routes must never
  return a key or URL". That guide is not edited; this decision is the
  exception. Transfer screenshots keep D-018's `has_screenshot` contract.
**Reason:** The storefront must store the key on the registration, and the key
alone (no URL, no second user) cannot read the private file.
**Source:** Owner follow-up, 2026-11-15.

### D-041: Every suspend and ban carries a reason
**Decision:** D-015's reason requirement applies to every seller suspend, not only
a farm rejection: every `POST /admin/sellers/:id/suspend` and every customer ban
needs a written reason. `apps/admin-koi` refuses the action without one.
**Reason:** The reason is what the affected farmer or customer sees, and the admin
team needs it to review a ban later.
**Source:** Owner follow-up, 2026-11-15. Extends D-015.

### D-042: Admins see masked PII; a full value needs a logged reveal
**Decision:** Admins see **masked** personal data everywhere, including
admin-only routes and the admin UI. The full value is reachable only through an
explicit reveal action that is logged with who, when, which record and which
field, in an append-only table. This applies to KTP/NIK, bank account and phone.
- The farm queue (US-021 AC1) shows masked values plus a reveal to compare the
  KTP/NIK, bank account and phone with the applicant.
- Answered `mvp-Q25`; supersedes the "open" line in D-039. Unblocks US-092
  T-092.2 and T-092.5, and US-021.
**Reason:** Staff still do the review, and every look at a full value leaves a
trace.
**Source:** Owner, answer to `mvp-Q25` (2026-11-15).

### D-043: Column-level encryption on top of disk encryption
**Decision:** The sensitive fields — NIK, bank account number and account-holder
name, phone — are encrypted at **column level**, on top of whole-disk/storage
encryption of the database. The existing wallet and top-up tables are included
in the same story (US-092), not a follow-up.
- Keys come from the environment, never the database or the repo.
- Existing plain values are migrated in a one-off migration script: read, encrypt
  in place, verify, and keep a rollback note; no plaintext copy is left behind.
- Answered `mvp-Q26`. US-010 – US-015 stay `done`; their encryption is delivered
  by US-092.
**Reason:** Disk encryption protects a stolen disk, not a leaked database user;
column encryption protects both.
**Source:** Owner, answer to `mvp-Q26` (2026-11-15).

### D-044: Winner sees the farmer's full bank account for its own lot
**Status: On hold (owner re-confirmed the hold, 2026-11-20; first held
2026-11-16).** Owner: "for now don't show farmer contact, that's all, I will
recalculate it." The D-059 return of 2026-11-17 is **superseded by this
re-hold**: the winner sees no farmer contact at all (no phone, D-052; no bank
account or holder name). US-051's built reveal stays shipped and its status is
unchanged, but nothing further is built on D-044/D-057. The text below stays as
the rule to restore if the owner brings it back. Context, not a decision: the
owner is considering Xendit escrow (`docs/releases/README.md`, Ideas not yet
planned), under which the winner never needs the farmer's bank account. If
restored, the reveal also returns the holder name (D-057).

**Decision:** The winner of a lot sees the farmer's **full** bank account, but
only for the lot they won, and only through the same logged reveal as D-042
(who, when, lot record, field). The farmer's view of the winner's phone stays
masked.
- This is a narrow exception to D-039, coordinated with D-040's private-key
  return.
- Confirmed 2026-11-15: the farmer's view of the winner's phone stays masked;
  the full number comes only through US-051's logged reveal of the winner's
  phone for the farmer's own sold lot. This is a confirmation of the line above;
  no separate decision is needed. **Superseded by D-052 (2026-11-16):** the
  farmer gets no winner phone at all, masked or revealed.
- Answered `mvp-Q27`; unblocks US-051.
**Reason:** The winner must type the full account number to transfer the money;
any other user, and any other lot, stays masked.
**Source:** Owner, answer to `mvp-Q27` (2026-11-15).

### D-045: A person sees their own full PII on their own record
**Decision:** A person may see their **own** full personal data on their **own**
record, with no reveal step. The scope is narrow:
- The customer's own phone and own bank details on the storefront account screen
  (`/store/customers/me`).
- The farmer's own seller record on `/vendor/sellers*` (own phone, own bank
  details, own NIK).
- Every other caller gets the masked value, **admins included** (D-042 stands).
  Another customer's, another farmer's, or the same person's data on someone
  else's record stays masked.
- Everything else in D-039 stands: values are still stored encrypted (D-043),
  masks apply everywhere else, and the logged reveal is still the only way to a
  non-owner's full value.
- This is a narrow exception to D-039, alongside D-040 and D-044.
- Consequences for US-092: AC3 becomes "no API result returns a full PII value
  to any client except the owner's own record"; AC4's "admins are not exempt"
  stays. T-092.4 becomes the self-view plus masking of anyone else's PII shown
  on those screens.
**Reason:** A person needs their own phone and account number to use the site;
masking them to the owner adds friction and protects nothing.
**Source:** Owner follow-up, 2026-11-15 (after D-042, D-044).

### D-046: Public pages show scheduled, live and closed auctions; never the winner
**Decision:** `/lelang`, the lot pages and the public store routes show lots of
auctions whose status is `scheduled`, `live` or `closed`. `draft`,
`pending_approval` and `cancelled` are never public.
- A closed lot shows its final price and whether it sold or went unsold
  ("terjual / tidak terjual"). It never shows who won: no winner id, name,
  masked name or any other winner field on a public route or page.
- The feed keeps its "Selesai" tab for closed lots.
- Answered `mvp-Q28`, option (b) with no time limit; unblocks US-040.
**Reason:** Past results show buyers real prices and build trust; the winner's
identity is private.
**Source:** Owner, answer to `mvp-Q28` (2026-11-15).
**Superseded in part:** by D-051 (2026-11-16). A closed lot's bid history is
shown in full with masked bidder names, so its top row shows the winner's
masked name. The rest stays in force: no winner id, full name or any
`winner_*` field on a public route or page.

### D-047: Join ships before bans; the ban check lands with strikes
**Decision:** US-041 (join) ships without a ban check. US-059 T-059.1 adds the
active-strike ban check to join, and to bid (US-042 AC1), when strikes exist.
- The "a banned customer can't join" clause of US-041 AC4 and "not banned
  users" in US-042 AC1 are delivered and verified by US-059, not by US-041 or
  US-042.
- Answered `mvp-Q29`, option (a); unblocks US-041.
**Reason:** No ban exists yet, so there is nothing to check; building strikes
first would hold back Milestone 4.
**Source:** Owner, answer to `mvp-Q29` (2026-11-15).

### D-048: Customers may join while the auction is scheduled or live
**Decision:** "Until the auction ends" means: a customer can join while the
auction's status is `scheduled` or `live`. That includes the time a lot runs
past the auction's `end_at` because of extends; the auction is still `live`
until every lot has closed (US-050). Any other status refuses the join.
- Answered `mvp-Q30`, option (a); unblocks US-041.
**Reason:** A lot in extension is still open for bids; joining follows the
auction's status, not its planned end time.
**Source:** Owner, answer to `mvp-Q30` (2026-11-15).

### D-049: Approval is refused once the start time has passed
**Decision:** The admin can't approve an auction whose `start_at` is now or in
the past. Approval fails with a clear error, nothing is charged, and the auction
stays `pending_approval`. The admin rejects it with a reason (D-031) so the
farmer picks new dates and resubmits.
- Answered `mvp-Q31`, option (b). Follow-up tasks T-032.6 and T-032.7; US-032
  stays `done`.
**Reason:** An auction that goes live at once runs shorter than the farmer
planned and its bidders had no notice.
**Source:** Owner, answer to `mvp-Q31` (2026-11-15).

### D-050: A cancelled lot stays visible on the public pages, labelled "Dibatalkan"
**Decision:** A lot cancelled inside a public auction (D-035) stays visible on
`/store/lots`, the lot page and `/lelang`, whether its auction is `scheduled`,
`live` or `closed`. It is labelled "Dibatalkan" and shows no price, no final
price, no "Terjual / Tidak terjual" and no winner. Bids on it are not shown
either.
- The auction's status still decides whether its lots are public at all:
  `draft`, `pending_approval` and `cancelled` auctions are never public (D-046).
- Answered `mvp-Q32`, option (b); unblocks US-091. Delivered by US-040 (routes
  and pages already handle it).
**Reason:** Hiding one lot from a running auction makes the auction look
incomplete, and a bidder who followed the lot can see it was stopped, not lost.
The reason stays private.
**Source:** Owner, answer to `mvp-Q32` (2026-11-15).

### D-051: Masked bidder format; full bid history on open and closed lots
**Decision:** Public pages and `/store/*` routes show every bidder as the first
3 letters of their first name + `***` + the last 2 characters of their customer
id, for example `Bud***x7`.
- No phone digits in the mask (D-039).
- The full name and the customer id itself never leave the server.
- The same bidder always shows the same mask within one auction.
- A lot's bid history (masked bidder, amount, time) is shown in full on open
  **and** closed lots. On a closed lot, the top row therefore shows the
  winner's masked name; the owner chose this knowingly.
- Supersedes D-046 in part: a closed lot still never exposes the winner's
  identity, id or any `winner_*` field; only the masked name in the history is
  now allowed.
- D-050 stands: a cancelled lot shows no bids.
- Answered `mvp-Q33` (part 1: option (b), lowercase example `Bud***x7`; part 2:
  option (c)); unblocks US-044.
**Reason:** A stable, PII-free mask lets bidders follow a lot's competition,
and a closed lot's full history shows how its price was reached.
**Source:** Owner, answer to `mvp-Q33` (2026-11-16).

### D-052: No phone between winner and farmer in the MVP
**Decision:** Neither side of a won lot sees the other's phone or WhatsApp
number, masked or revealed.
- The winner sees the farmer's bank account (full, through the logged reveal,
  D-044) and nothing else of the farmer's contact data.
- The farmer sees the winner's name and nothing else of the winner's contact
  data. The farmer's reveal of the winner's phone (D-044 confirmation,
  2026-11-15) is dropped.
- No `wa.me` link or any "chat on WhatsApp" button: it needs the full number.
- The winner pays the farmer directly into the revealed bank account. If the
  farmer needs to reach the buyer, they use the contact information they
  already have (owner's words; what that is, in the MVP, is `mvp-Q37`).
- Supersedes the 2026-11-15 confirmation bullet of D-044 and the plan's
  "the winner sees the farmer's WhatsApp … the farmer sees the winner's …
  WhatsApp" (Closing and winners).
- Answered `mvp-Q34`; unblocks US-051 and US-053 T-053.2.
**Reason:** Phones are PII (D-039); the bank account is the only contact data
a winner needs to pay.
**Source:** Owner, answer to `mvp-Q34` (2026-11-16).
**Changed 2026-11-16:** the farmer also gets the winner's saved address
(masked, full through a logged reveal, D-056); "no phone either way" stands.
The winner's bank-account bullet is on hold with D-044.

### D-053: A lot never marked delivered stays shipped
**Decision:** When the winner never marks a lot delivered, nothing happens in
the MVP: the lot stays `shipped`. No scheduled job, no auto-confirm and no
setting for it. The claim window (4 hours from delivered) never opens for that
lot.
- "Auto-confirm delivery after N days" is kept in `docs/releases/README.md`,
  Ideas not yet planned.
- Answered `mvp-Q35`, option (a).
**Reason:** Keeps the MVP small; the sale already stands once shipped.
**Source:** Owner, answer to `mvp-Q35` (2026-11-16).

### D-054: A farm suspended after approval may finish its sold lots
**Decision:** A farm suspended after approval (D-041) may still mark its
already-sold lots `paid` and `shipped`, so buyers are not stranded. It can't
create auctions or lots, or do any other farmer action.
- The paid and shipped routes (US-052) do **not** run `validateSellerOpenStep`.
  They check instead that the lot belongs to the caller's seller and that the
  seller's status is not `terminated` (`SellerStatus.TERMINATED`, Mercur
  2.3.7, `@mercurjs/types` `seller/common`). A terminated farm gets 403.
- Every other custom `/vendor/*` mutation keeps `validateSellerOpenStep`.
- A rejected farm (D-015) is also `suspended`, but owns no sold lot, so the
  ownership check refuses it.
- Answered `mvp-Q36`, option (a).
**Reason:** A suspension punishes the farm, not the winner who already paid.
**Source:** Owner, answer to `mvp-Q36` (2026-11-16).

### D-055: User-facing error messages are Indonesian, written on the backend
**Decision:** Every error message a Koi app may show verbatim is written in
Indonesian on the backend, with rupiah formatted `id-ID` (`Rp1.100.000`).
- `@mercurjs/client` keeps only `message` and `code` (plus the HTTP status)
  from an error body, so the server's message is the last place the copy the
  customer reads can be right.
- Patching or wrapping the client to carry extra fields is rejected.
- Apps still key behaviour on `code` / status, never on message text. A 409
  body is rewritten by Medusa, so its message never reaches a user; the app
  writes that copy itself.
- Admin-only messages follow the same rule when admin-koi shows them verbatim.
**Reason:** The customer sees exactly what the server wrote; a translation in
the client can't see fields the client already dropped.
**Source:** Owner (2026-11-16), after the US-042 `bid_too_low` follow-up.

### D-056: Farmer gets the winner's saved address, masked, full through a logged reveal
**Decision:** The farmer ships to the address already saved on the winner's
customer account: the winner's **default shipping address**
(`customer_address.is_default_shipping = true`; Medusa allows at most one per
customer, unique index `IDX_customer_address_unique_customer_shipping`).
- **Mask (one rule):** on the farmer's sold-lot row only `city` and `province`
  are shown. `address_1`, `address_2` and `postal_code` are **not sent** in the
  row at all. The helpers in `packages/api/src/utils/mask.ts` keep a value's
  first or last characters, which on a street line would leak the house number,
  so none of them is used for addresses.
- **Reveal:** the full address comes only through an explicit reveal by the
  farmer, for their own sold lot, logged in `pii_reveal_audit` exactly like
  D-042/D-044: who (`actor_type`, `actor_id` from `req.auth_context`), when,
  `record_type: "lot"`, `record_id: <lot id>`, `field: "shipping_address"`. One
  reveal returns the whole address (`first_name`, `last_name`, `address_1`,
  `address_2`, `postal_code`, `city`, `province`, `country_code`) and writes
  **one** audit row. The address's own `phone` and `company` are never read.
- The address is read at reveal time (the current default), not copied onto
  the lot at close.
- **No default address:** the farmer's row shows "Alamat belum diisi" and has no
  reveal; a reveal call gets 404 with no audit row. The winner's won-lot page
  shows a prompt to add one, linking to the account address page (`/akun/alamat`).
- **Relaxes D-052 for the address only.** No phone either way still holds: the
  farmer never gets the winner's phone (the account's or the address's), masked
  or full, and there is no `wa.me` link.
- Answered `mvp-Q37`, option (a) with a logged reveal.
**Reason:** The farmer needs a full address to ship; the MVP has no order to
carry one, and the account already holds it. The reveal keeps every look traced.
**Source:** Owner, answer to `mvp-Q37` (2026-11-16).

### D-057: The winner's bank reveal includes the holder name (on hold with D-044)
**Status: On hold with D-044 (owner reconsidering, 2026-11-16). Intended rule,
not built.**
**Decision:** If the winner's reveal of the farmer's bank account (D-044) comes
back, one reveal returns the full `account_number` **and** the full
`holder_name`, and writes **one** audit row with `field: "bank_account"`
(`record_type: "lot"`), the same one-reveal-one-row shape as D-056.
- Answered `mvp-Q39`, option (b), with one row per reveal instead of one per
  field.
**Reason:** The payer checks the name on the account before transferring.
**Source:** Owner, answer to `mvp-Q39` (2026-11-16).

### D-058: The MVP pays off-platform; the farmer marks the lot paid
**Status: In force (2026-11-17).** Supersedes the "payment model under review"
note in `docs/releases/mvp/stories.md` and un-parks US-056, US-058, US-059's
payment strike and T-052.4.
**Decision:** The winner pays the farmer directly, outside the app, within
1×24 h of the lot closing. The farmer marks the lot paid (`won → paid`,
`POST /vendor/sold-lots/:id/paid`) and then ships it. The platform holds no
money and pays out nothing in the MVP. No wallet debit, no new ledger type, no
payout balance.
- Xendit escrow (invoice/webhook in, xenPlatform out) stays the planned
  direction for beta, still out of MVP scope per `plan.md:14`.
- A platform-held "wallet escrow" was offered and not chosen.
**Reason:** the goal is a shippable MVP; off-platform is what the plan already
scoped, and it makes the 1×24 h deadline, the non-payment report and the
strikes reachable end to end.
**Source:** Owner, answer to the payment-model question (2026-11-17).

### D-059: D-044 returns — the winner sees the farmer's bank account, logged
**Status: In force (2026-11-17).** Ends the 2026-11-16 hold on D-044; D-057
takes effect with it.
**Decision:** The winning bidder, on their own won lot only, reveals the
farmer's full `account_number` and `holder_name` through the existing logged
reveal (one `pii_reveal_audit` row, `record_type: "lot"`,
`field: "bank_account"`). No phone, no `wa.me` link — D-052 stands unchanged.
The reveal is the only way to get the full account number: a list or detail
response carries at most a mask (last 4 digits, holder name masked per word,
both from `src/utils/mask.ts`), never the full number. (Wording corrected
2026-11-18: US-051 AC3 requires the mask on the winner's row, so "never in a
list response" was wrong.)
**Reason:** D-058 makes the winner the payer, and a payer with no account
number cannot pay.
**Source:** Owner (2026-11-17), after D-058.

### D-060: A farm suspended after approval may also decide its own claims
**Status: In force (2026-11-17).** Extends D-054.
**Decision:** Accepting or disputing a claim on a lot the farm itself sold uses
the D-054 exception — ownership plus "not `terminated`" — not
`validateSellerOpenStep`. `pending_approval`, a rejected registration and
`terminated` still return 403. A suspension must not strand an `open` claim with
no decision path, because the admin only acts on `disputed`.
**Reason:** D-054's purpose is that a suspension punishes the farm, not the
winner; a stranded claim punishes the winner.
**Source:** Owner, answer to `mvp-Q45`, option (b) (2026-11-17).

### D-061: The auction's live link is a plain column
**Status: In force (2026-11-17).** Answers `mvp-Q43`.
**Decision:** `auction.live_stream_url` is a nullable column on the auction
model (not a Mercur custom field, not a field only reachable through admin).
The farmer writes it through `POST /vendor/auctions/:id/live-link` in any status
except `closed` and `cancelled`; admin-koi exposes the same write. It renders as
an outbound link — no iframe, no embedded player, no host check beyond the
stated YouTube/Instagram allow-list.
- Owner considered a Mercur custom field for an independent `/dashboard`
  fallback and a real `/dashboard` widget; both were rejected in favour of the
  simpler column.
**Reason:** one migration, direct reads, no side table; Mercur's own admin has
no auction screen at all (verified: zero auction references in
`@mercurjs/admin`), so a custom field would buy an API-level door, not a screen.
**Source:** Owner, answer to `mvp-Q43` (2026-11-17).

### D-062: Medusa's address snapshots are covered by phone encryption
**Status: Drafted 2026-11-20, pending owner approval (`mvp-Q53`).** The rule is
built and verified in US-092; only the owner's wording sign-off is outstanding.
Answers the US-092/T-092.1 scope question; extends D-039 and D-043.
**Decision:** the `phone` column of Medusa's address snapshots — `cart_address`,
`order_address`, `fulfillment_address`, `stock_location_address` — is
encrypted like every other phone column (D-043). D-039's "personal data is
encrypted at rest" covers these tables; the exclusions in D-040, D-044 and D-045
do not apply to them.
**Reason:** the shipping address carries the phone, and it is written by
Medusa's own cart and order workflows, not by a Koi route, so the
`encryptPiiBody` middleware on Koi write routes never sees it. Leaving it plain
would leave the most copied PII column in the database unencrypted while the
customer record beside it is ciphertext.
**Source:** Owner, decision on the US-092/T-092.1 scope question (2026-11-20).

### D-063: A bid-removal reason caps at 500 characters
**Status: In force (2026-11-20).**
**Decision:** the removal reason an admin writes on `POST /admin/bids/:id/remove`
is required, non-blank, and at most **500 characters** — the same cap as US-059's
strike reason. A longer reason is rejected with an Indonesian message and no
write (answers `mvp-Q52`).
**Reason:** the cap matches the strike reason so the two admin reason fields
behave the same, and a runaway paste cannot bloat the `bid.removed_reason`
column or the admin panel row.
**Source:** Owner, answer to `mvp-Q52` (2026-11-20).

### D-064: The lot page is the only bidding surface; the live room is removed
**Status: In force (2026-11-24).** Answers `mvp-Q57`, option (b). Supersedes the
separate live bidding room from US-046 and plan "Technical approach > Key flows >
Live room".
**Decision:** bidding happens on the lot page (`/lelang/<lot>`) only, as the
redesign boards 04, 05, 13 and 14 show it. The separate live room
(`/lelang/<lot>/live`, US-046) is removed as a screen; it is no longer a bidding
page. Old links redirect to `/lelang/<lot>` (the owner would also accept a 404;
we redirect because it is gentler on old bookmarks). The lot page carries the
full bid surface: guest join prompt, join dialog, short-balance state, quick
amount chips, confirmation sheet, the pending "Mengirim bid…" state, the
highest/outbid/rejected/extended states, and the sticky mobile action bar. The
farmer's live link (D-061) renders on the lot page instead of the room; D-061's
column and routes are unchanged.
**Superseded behaviour:** the live room from US-046 / plan "Key flows > Live
room" — a separate screen showing one lot at a time with its own bid board.
**Bid rules unchanged:** D-058 (the winner pays the farmer directly within 1×24 h
and the platform holds no money), the join fee (the auction category's fee, once
per auction, D-007 and D-034), the extend window (`extend_window_minutes`, one
setting), and the rejected held-balance, auto-pay-from-wallet and escrow items
all stay exactly as they are. This decision changes where bidding is shown, not
how bidding works.
**Reason:** the owner wants the design's single-page flow — a bidder never
switches screens to bid.
**Source:** Owner, answer to `mvp-Q57`, option (b) (2026-11-24).

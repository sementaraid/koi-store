# Koi Store: MVP Stories and Tasks

**Source of truth:** `plan.md` (this folder). Every story here traces back to a plan
section. Nothing here adds rules the plan doesn't contain. Gaps are listed under
[Open questions](#open-questions) and need an owner decision before they're built.

**Owner:** the `product-owner` agent maintains this file. Builders (`backend`,
`frontend`) and `qa` refer to story IDs in their reports.

**Release status:** in progress. See `docs/releases/README.md`.

IDs, statuses and task tags follow the conventions in `docs/README.md`. Roles
are defined in `docs/product/overview.md`.

---

## Status as of 2026-11-16

**Last accepted stories:** US-040, US-041, US-042 (Epic 4), qa PASS on every AC
and accepted the same day. US-033 was the pass before. T-030.8, T-032.6, T-032.7
and T-020.10 (seed fix) were accepted earlier. The `bid` model and the bid/join
code are still **uncommitted** — commit before US-050 T-050.1's migration builds
on them.

**Counts** (computed from this file, 2026-11-17; US-043 and US-050 accepted):

| Epic | Stories done | In progress | Todo | Parked | Blocked | Tasks done | Tasks open | Tasks parked |
|---|---|---|---|---|---|---|---|---|
| 0 Foundations | 3 | 0 | 0 | 0 | 0 | 9 | 0 | 0 |
| 1 Wallet | 6 | 0 | 0 | 0 | 0 | 22 | 0 | 0 |
| 2 Becoming a farmer | 2 | 0 | 0 | 0 | 0 | 11 | 5 | 0 |
| 3 Auctions for farmers | 4 | 0 | 0 | 0 | 0 | 23 | 0 | 0 |
| 4 Joining and bidding | 4 | 0 | 3 | 0 | 0 | 17 | 8 | 0 |
| 5 Closing and after-sale | 1 | 0 | 9 | 2 | 0 | 3 | 41 | 4 |
| 6 Admin operations | 0 | 0 | 6 | 0 | 0 | 0 | 22 | 0 |
| 7 WhatsApp bot | 0 | 0 | 0 | 0 | 6 | 0 | 12 | 0 |
| 8 Pilot | 0 | 0 | 1 | 0 | 0 | 0 | 5 | 0 |
| **Total** | **20** | **0** | **19** | **2** | **6** | **85** | **93** | **4** |

Epic 2's open tasks are US-021's T-021.2/.3/.4/.6 (follow-ups on a `done` story)
and the new T-020.10 (seed an admin user). Blocked: US-080 – US-085 (mvp-Q12).
Epic 5 task count drops by one: T-051.3b dropped (D-052). US-051 unblocked by D-052 (2026-11-16).

**Parked (2026-11-16, owner recalculating the payment model; not blocked by a question).**
Stories: US-056, US-058. Tasks inside `todo` stories: T-051.1a, T-051.3a, T-051.2a
(winner bank-account reveal; D-044 on hold), T-052.4 (mark paid; a Xendit webhook
replaces it under escrow). Partial: US-059's "winner didn't pay" strike part.
**Only newly blocked: none.** `mvp-Q37` and `mvp-Q39` answered (D-056, D-057).

**Needed under either payment model (keep building):** US-043, US-050, US-051
farmer side (T-051.1b, .5, .2b), the shipped half of US-052, US-053 (marking
delivered becomes the payout trigger), US-054/US-055 (the claim window gates the
payout), US-057, US-060, US-061.

**Payment model open (owner, 2026-11-16):** until it is decided, an auction can
end with a winner but with **no in-app way to pay**. Owner is recalculating;
planned direction (not a decision) is Xendit escrow (`docs/releases/README.md`,
Ideas not yet planned). D-044 is on hold, so the 1×24 h payment deadline
(US-058, strikes) can't work end to end. Stopgap options **not chosen**:
(1) the pilot pays off-platform, as WhatsApp auctions do today; (2) wallet-held
escrow without Xendit (a new money flow, needs owner approval).

**Docs out of date (owner edit needed, not edited here):**
`apps/storefront-koi/CLAUDE.md:97-98` still says the farmer's WhatsApp and bank
details are shown to the winner and the farmer sees the winner's WhatsApp. It
contradicts D-052 (no phone either way), D-044 (on hold) and D-056.

**Next in milestone order:**
1. US-043 T-043.1 (extend + the bid-after-end gate, the gap found while checking
   the brief), T-043.2 in the same run, then T-043.3 (storefront).
2. US-050 T-050.1 → T-050.2 (close workflows + `close-lots` job), T-050.3 qa.
3. US-051: farmer side T-051.1b → T-051.5 → T-051.2b (sold lots, winner's name +
   masked address, D-052/D-056); winner side T-051.6 → T-051.7 (won lots, no farmer
   contact, D-044 on hold). T-051.1a/.3a/.2a parked.
4. US-052 shipped half (T-052.1 split, T-052.2 shipped only, T-052.3), then US-053
   T-053.1, T-053.2 (after T-051.7), T-053.3. T-052.4 (mark paid) parked.
5. US-044 (D-051) can run anytime after US-042's commit; T-044.1 touches only the
   store lot routes, no bid workflow.
T-020.10 can run any time; qa's admin browser checks need it.

## Epic 0: Foundations (Milestone 1)

### US-001 Admin signs in to the admin app · `done`
As an **admin**, I want to sign in to the admin app so that only the admin team
can reach admin screens.
- AC1: Signing in with a Medusa admin user's email and password opens the admin home.
- AC2: A customer account is refused with "Akun ini tidak punya akses admin."
- AC3: A wrong email or password shows one generic message.
- AC4: Every page under `(app)` redirects to `/masuk` when no one is signed in.
- [x] T-001.1 [admin] Login form, httpOnly cookie `_koi_admin_jwt`, `requireAdmin()` guard
- [x] T-001.2 [admin] Tests for `actor-id` and `safe-redirect`

### US-002 Customer registers and signs in · `done (evidence: packages/api/integration-tests/http/register-e2e.spec.ts:25-68; password-reset-smtp.spec.ts:119-185; password-reset.spec.ts:53-73; customer-phone.spec.ts:46-99; qa PASS)`
As a **visitor**, I want to register and sign in so that I can top up, join
auctions and bid. *(Plan: Users and roles)*
- AC1: Registering with name, email, phone and password creates a customer account.
- AC2: Sign in, sign out, forgotten password and setting a new password all work. The reset email is actually delivered (D-013: SMTP via `nodemailer`; Mailpit in dev).
- AC3: The phone number is required and is stored on the customer as the account's WhatsApp number (US-080). *(D-008, answers mvp-Q1)* The backend enforces it too: `POST /store/customers` without a phone is rejected (D-014).
- [x] T-002.1 [storefront] Pages `daftar`, `masuk`, `lupa-sandi`, `atur-sandi`, `keluar` exist
- [x] T-002.2 [qa] Verify AC1–AC2 end to end against the backend — `register-e2e.spec.ts:25-68` (register, phone saved normalised, sign-in, exactly one wallet); `password-reset-smtp.spec.ts:119-160` (real SMTP send, reset link, new password signs in); `:162-185` (redelivered event sends one email)
- [x] T-002.3 [qa] Verify AC3: registering without a phone is refused, by the form and by `POST /store/customers` directly, and the phone is saved on the customer — `customer-phone.spec.ts:46-99` (missing/empty/malformed refused; `/me` can't clear it; valid phone normalised)
- [x] T-002.4 [backend] Password-reset email delivery over SMTP with `nodemailer` (D-013); `SMTP_*` vars in `.env.template`; Mailpit for dev — `src/subscribers/password-reset.ts`, `src/modules/smtp-notification/service.ts`, `medusa-config.ts:57-81`, `.env.template:12-21`
- [x] T-002.5 [backend] Reject `POST /store/customers` without a phone (D-014) — `src/api/middlewares.ts:51-91`, `src/api/store/customers/validators.ts:3-16`; `customer-phone.spec.ts:46-99`
- **Accepted 2026-11-14.** AC2's Mailpit caveat doesn't block: `password-reset-smtp.spec.ts:119-160` boots the real SMTP provider and asserts delivery through `nodemailer`, which is the code path. Mailpit is only the SMTP endpoint, and the missing env vars are container config, not code. qa's copy bug (`NewPasswordForm.tsx:92`, 15 minutes) is fixed. Phone uniqueness across accounts is not enforced; that belongs to US-080, not this story.

### US-003 One shared design system · `done`
As the **owner**, I want the storefront and the admin app to share one UI kit so
that they look and work the same. *(Plan: Frontends)*
- [x] T-003.1 [ui] `packages/ui` with Button, Card, Badge, Input, FormField, RenderIf, primitives
- [x] T-003.2 [storefront] [admin] Both apps import `@koi/ui`

---

## Epic 1: Store-credit wallet (Milestone 2)

Rules for every story in this epic: money is whole rupiah in integer columns;
transactions are append-only; balance = sum of transactions; credit only pays
platform fees (no withdrawals, no transfers, no paying farmers).

### US-010 Customer sees balance and history · `done (evidence: packages/api/integration-tests/http/wallet.spec.ts:86-161; packages/api/integration-tests/http/customer-wallet.spec.ts:33-171; packages/api/src/modules/wallet/__tests__/wallet.spec.ts:15-53; qa PASS)`
As a **customer**, I want to see my balance and every transaction so that I
know what I can spend. *(Plan: Store credit wallet)*
- AC1: Balance equals the sum of my transactions.
- AC2: History lists type, signed amount, reference and date, newest first.
- AC3: The wallet is created when the profile is complete (D-011). Each customer has exactly one wallet, enforced by a unique constraint.
**PII (D-039, D-043):** the wallet and top-up tables are encrypted in US-092 (T-092.8). US-010 stays `done`; US-092 delivers it.
- [x] T-010.1 [backend] Wallet module: `wallet`, `wallet_transaction` (type, amount as whole rupiah with no size cap (D-012), reference, created_by). Link wallet ↔ customer, with a unique constraint so there is one wallet per customer (D-011) — `src/modules/wallet/`, `src/links/customer-wallet.ts`, `src/migration-scripts/customer-wallet-unique-customer.ts`
- [x] T-010.2 [backend] Store route `GET /store/wallet` (balance + paginated transactions), identity from `auth_context` — `src/api/store/wallet/route.ts:28-75`; `wallet.spec.ts:86-161`
- [x] T-010.3 [storefront] Balance and history page under `akun` — `akun/saldo/page.tsx`; `AccountPage/components/Wallet.tsx`
- [x] T-010.4 [qa] Balance = sum; no update or delete path exists on transactions; a customer with an incomplete profile has no wallet, and completing the profile creates exactly one (also when the event fires twice) — `wallet.spec.ts:86`; `wallet.spec.ts` (module) `:36`; `customer-wallet.spec.ts:33-65,153-171`
- [x] T-010.5 [backend] Subscriber on `customer.created` and `customer.updated` runs an idempotent create-wallet workflow when the profile is complete (D-011) and no wallet exists — `src/subscribers/customer-wallet.ts`, `src/workflows/create-customer-wallet.ts`

### US-011 Customer requests a top-up · `done (evidence: packages/api/integration-tests/http/topup-requests.spec.ts:102-354; packages/api/src/api/store/topup-requests/route.ts:14-42; apps/storefront-koi/src/lib/data/topups.ts:65-88; qa PASS fix round 1)`
As a **customer**, I want to upload my transfer screenshot so that admin can
credit my wallet. *(Plan: How credit moves 1–2)*
**Depends on:** US-015 (the platform bank account is a setting in the settings table, D-009, D-010)
**Note:** the bank account lives in the settings table (D-009, D-010). Its admin
surface stays admin-only; the storefront reads the three bank fields from the
customer-facing `GET /store/platform-bank-account`, added by this story. That
route was the agreed way to keep the settings surface off `/store/*`.

**Screenshots are private (fix round 1, backend):** files go to a non-public
directory. The customer API returns `has_screenshot: boolean` instead of a
`screenshot_url`, so no customer ever receives a link to anyone's transfer
proof. Admins fetch the image through `GET /admin/topup-requests/:id/screenshot`
(admin token; D-018).
- AC1: Any amount is accepted (no minimum), as an integer.
- AC2: Uploading a screenshot creates a `pending` top-up request. The balance doesn't change yet.
- AC3: The page shows the platform's bank account to transfer to, read from the admin setting. *(D-009, answers mvp-Q2)*
- AC4: I can see my requests and their status (pending, approved, rejected with reason).
**PII (D-039):** the screenshot stays a private file (D-018). Any account number or phone shown with a request is masked; the top-up table is encrypted by US-092 (D-043, T-092.8).
- [x] T-011.1 [backend] `topup_request` model (amount, screenshot file, status, reviewed_by, reason) + create workflow — `src/modules/wallet/models/topup-request.ts`; `topup-requests.spec.ts:102,126,131,138,165`
- [x] T-011.2 [backend] Store routes: create request (with file upload), list my requests, read the platform bank account from settings (US-015) — `src/api/store/topup-requests/route.ts`, `src/api/store/platform-bank-account/route.ts`; `topup-requests.spec.ts:180,222,231,264-354`; private files at `medusa-config.ts:84-105`
- [x] T-011.3 [storefront] Top-up form with the platform bank account, and the request list — `apps/storefront-koi/src/lib/data/topups.ts:65-88` (auth headers, `no-store`); TopupPage
- [x] T-011.4 [qa] Pending requests never change the balance — `topup-requests.spec.ts:102` (pending, 0 ledger rows)

### US-012 Admin approves or rejects a top-up · `done (evidence: packages/api/integration-tests/http/admin-topup-requests.spec.ts:102-309; admin-topup-requests-compensation.spec.ts:43-80; topup-requests.spec.ts:314-349; qa PASS)`
As an **admin**, I want to approve a top-up after checking the bank statement so
that credit only exists for real transfers. *(Plan: How credit moves 3)*
- AC1: Approving records one `manual_topup` (+) with the admin and a bank reference.
- AC2: Rejecting needs a reason that the customer can see. No transaction is recorded.
- AC3: A request can be decided only once.
- AC4: The screenshot is shown only to an admin, fetched through `GET /admin/topup-requests/:id/screenshot` (admin token), never from a stored public URL (D-018).
**PII (D-039, D-043):** the account number the customer transcribes, and any phone shown beside a request, are masked in API results and screens; the top-up table is encrypted by US-092 (T-092.8). US-012 stays `done`.
- [x] T-012.1 [backend] Approve/reject workflow (one mutation per step, compensation) + `/admin` routes — `src/workflows/decide-topup-request.ts:28-73`, `src/workflows/steps/decide-topup-request.ts:21-95`, `src/api/admin/topup-requests/`; `admin-topup-requests.spec.ts:196-309`, `admin-topup-requests-compensation.spec.ts:43-80`
- [x] T-012.2 [admin] Top-up queue `/saldo/topup`: screenshot via the admin route (not a stored URL), amount, approve/reject with reason — `apps/admin-koi/src/lib/data/topups.ts:91,112,142` (`requireAdmin` on each action)
- [x] T-012.3 [qa] Double approval impossible; audit fields saved; the screenshot route answers 200 with an admin token and 401 with a customer token or none — `admin-topup-requests.spec.ts:255-272,292-309`; `topup-requests.spec.ts:314-349`
- **Accepted 2026-11-14.** Known limits, not AC failures: a double decision shows a generic toast because Medusa replaces the 409 text; the lock is in-memory (see US-090 T-090.4); the confirm/busy UI and screenshot render were read in code, not driven in a browser.

### US-013 Admin adjusts a balance · `done (evidence: packages/api/integration-tests/http/admin-wallet-adjustments.spec.ts:91-207; qa-wallet-adjustments-concurrency.spec.ts:66-125; packages/api/src/modules/wallet/service.ts:8-25; qa PASS fix round 1)`
As an **admin**, I want to correct a balance with a written reason so that
mistakes are fixed without editing history. *(Plan: Transaction types, Rules)*
- AC1: An adjustment can be + or −, and needs a reason. The admin is recorded.
- AC2: Existing transactions are never changed.
- AC3: A correction that would make the balance negative is refused with a clear error, and nothing is written (D-019).
**Note:** admin-koi shows Indonesian copy for the no-wallet error and the below-zero error.
**PII (D-039, D-043):** no PII of its own; the wallet table it reads is encrypted by US-092 (T-092.8). US-013 stays `done`.
- [x] T-013.1 [backend] Adjustment workflow + `/admin` route — `src/workflows/create-wallet-adjustment.ts:27-57`, `src/workflows/steps/create-wallet-adjustment.ts:25-59`; `admin-wallet-adjustments.spec.ts:91-207`
- [x] T-013.2 [admin] `/saldo/koreksi` screen — `apps/admin-koi/src/lib/data/wallet-adjustments.ts:60,86,120` (`requireAdmin`; signed amount built server-side from direction + magnitude), `src/lib/helpers/wallet-error.ts` (Indonesian copy, tested)
- [x] T-013.3 [qa] Reason required; append-only holds; a correction below Rp0 is refused and writes nothing (AC3) — `admin-wallet-adjustments.spec.ts:116-146,180-207`; `qa-wallet-adjustments-concurrency.spec.ts:104-125` (lock released on the refused path)
- **Accepted 2026-11-15.** Not AC failures: the history doesn't show `created_by` after a reload (the GET route omits it; the DB stores it); a signed-out redirect loses the deep link (pre-existing); the UI wasn't driven in a browser.

### US-014 Admin edits the fee table · `done (evidence: packages/api/integration-tests/http/fee-categories.spec.ts:50-172; packages/api/src/modules/platform-settings/models/fee-category.ts:7-17; apps/admin-koi/src/components/FeeTable.tsx; qa PASS; AC3 carried forward to US-030 AC7)`
As an **admin**, I want to edit each category's listing and join fees so that
pricing can change without code. *(Plan: Fees)*
- AC1: The fee table holds category name, listing fee per lot and join fee per auction (integers).
- AC2: It's seeded with the four approved categories and fees (Lokal no cert 50.000/100.000, Lokal cert 100.000/250.000, Import cert 200.000/500.000, Premium 400.000/1.000.000).
- AC3: *(Carried forward to US-030 AC7.)* A change applies only to auctions created after it, never to approved ones. It needs the auction table, which US-030 builds, so this story can't prove it.
- [x] T-014.1 [backend] `fee_category` model, seed, `/admin` CRUD routes — `src/modules/platform-settings/models/fee-category.ts:7-17`, `src/scripts/seed-fee-categories.ts:6-30`, `src/api/admin/fee-categories/`; `fee-categories.spec.ts:50-172`
- [x] T-014.2 [backend] *(Superseded, moved to US-030 T-030.6)* Auctions store the fees they were created with (snapshot) — passed as T-030.6, `farmer-auctions.spec.ts:255-281,445-512`
- [x] T-014.3 [admin] `/pengaturan/biaya` screen — `apps/admin-koi/src/components/FeeTable.tsx`, `src/lib/data/fee-categories.ts`
- **Accepted 2026-11-14 with AC3 carried forward.** AC3 and T-014.2/T-014.4 are not passed here: they need the auction table. US-030 AC7, T-030.6 and T-030.7 prove them, and US-030's qa must check them.
- [x] T-014.4 [qa] *(Superseded, moved to US-030 T-030.7)* Editing a fee doesn't change an existing auction's fees — passed as T-030.7, `farmer-auctions.spec.ts:255-281`

### US-015 Admin edits auction settings · `done (evidence: packages/api/integration-tests/http/admin-settings.spec.ts:84-217; apps/admin-koi/src/components/SettingsForm.tsx; qa PASS)`
As an **admin**, I want to change the platform limits so that rules can be tuned.
*(Plan: Structure, Extend, Dead-on-arrival claims, How credit moves 1)*
- AC1: Editable values: extend window (default 5 min), max lots per auction (20), auction length (1–7 days), claim window (4 h), platform bank account (D-009).
- AC2: *(Carried forward to US-030 AC6.)* An extend-window change applies only to auctions that haven't started. It needs the auction table, which US-030 builds; no auction exists yet, so this story can't prove it.
- AC3: Settings are stored in a settings table in the database, not in env vars or config. *(D-010, answers mvp-Q3)*
- [x] T-015.1 [backend] Settings table + `/admin` routes (D-010) — `src/modules/platform-settings/`, `src/api/admin/settings/route.ts`; `admin-settings.spec.ts:84-217`
- [x] T-015.2 [admin] Settings section in `/pengaturan/biaya`, including the platform bank account — `apps/admin-koi/src/components/SettingsForm.tsx`
- [x] T-015.3 [qa] Live auctions keep their original extend window — superseded, moved to US-030 T-030.5, because it needs the auction table; passed as T-030.5, `farmer-auctions.spec.ts:255-281`

---

## Epic 2: Becoming a farmer (Milestone 2)

Uses option A from D-003 (`docs/product/decisions.md`): a member login, `POST /vendor/sellers`,
the seller starts as `pending_approval`, a second member login right after registration
(D-030), and admin approval grants farmer access.

### US-020 Customer registers a farm · `done (evidence: packages/api/integration-tests/http/farm-registration.spec.ts:182-505; packages/api/src/api/utils/farm-registration.ts:55-142; packages/api/src/workflows/hooks/seller-registration.ts:52-96; packages/api/src/api/middlewares.ts:110-122,277-290; apps/storefront-koi/src/lib/data/farm.ts:52-232; qa PASS)`
As a **customer**, I want to submit a farm registration so that I can sell koi
at auction. *(Plan: Becoming a farmer)*
- AC1: The form requires farm name, location, KTP photo, KTP number (16-digit NIK), farm photos, and a bank account in my own name (D-017).
- AC4: The farm WhatsApp number is my registration phone, copied to `seller.phone`. The form shows it prefilled and not editable (D-016).
- AC5: KTP photo, NIK and bank details are stored privately and never appear on a public route, including `/store/sellers` (D-017).
- AC6: The seller's `member_email` must match my signed-in auth identity's email; any other email is rejected.
- AC2: Submitting creates the seller as `pending_approval` under my same email and password.
- AC3: I can see my registration status.
**PII (D-039, D-043):** the stored NIK, bank details, phone and the KTP photo are encrypted at rest, and every API result and screen shows them masked, except the farmer's own registration screen, which shows the owner's own full values (self-view, D-045). US-092 delivers it (D-042, D-043, D-045). The private-key return to the uploader is confirmed by D-040.
- [x] T-020.1 [backend] Native seller fields cover name, description, address, `payment_details` (bank) and `phone`. Store KTP photo, NIK and farm photos as Mercur Custom Fields on `Seller` (`resources/best-practices/custom-fields`). List the doc pages used
- [x] T-020.5 [backend] Private upload route for the KTP photo. Mercur's `POST /vendor/uploads` needs an existing seller and stores files publicly, so it can't be used (D-017)
- [x] T-020.6 [backend] Middleware on public `/store/sellers` routes that strips `payment_details`, `professional_details` and `custom_fields` (KTP, NIK) (D-017)
- [x] T-020.7 [backend] Validate hook on `POST /vendor/sellers`: `member_email` from the body must match the caller's auth identity email (AC6)
- [x] T-020.8 [backend] Copy the customer's phone to `seller.phone` at registration (D-016)
- [x] T-020.2 [storefront] Member sign-in with the same credentials + `POST /vendor/sellers` flow, then member sign-in again right after registration to get a token for the new seller (D-030)
- [x] T-020.3 [storefront] Farm registration form + status page in the Farmer area
- [x] T-020.4 [qa] KTP photo, NIK and bank data never appear on public pages or any `/store/*` response; a mismatched `member_email` is rejected
- [x] T-020.9 [backend] *(Seed fix, not an AC. Found during the T-033.2 render check.)* Seed one dual-actor demo farmer: a customer row, its wallet and balance (D-011), the member login and an `open` seller under the same email, so the Farmer area (`/akun/kebun*`) and top-up work for that account. Today `sakura.koi.farm@koi.dev` exists only as member + seller: no customer row, no wallet, so no seeded farmer can use the Farmer area, while US-020 assumes a farmer is a customer. Extend `src/scripts/seed-koi.ts`; keep the existing logins. The `docs/process/flow.md` credential line for the Farmer area is only accurate once this lands. — commit `1dc43de`, `packages/api/src/scripts/seed-koi.ts:701-710,911-981` (customer + wallet Rp500.000 + member + `open` seller; idempotent re-run); Farmer area signed in as that login in the US-033 render check
- [ ] T-020.10 [backend] *(Seed fix, not an AC. Found during the 2026-11-16 acceptance.)* The seed creates **no admin user**. Add a seeded admin to `src/scripts/seed-koi.ts` so `apps/admin-koi` (`/masuk`) and the `[qa]` browser checks have a login. Read `ADMIN_EMAIL` and `ADMIN_PASSWORD` from env, defaulting to `admin@koi.dev` / `supersecret`; add both to `packages/api/.env.template` with the safe placeholder (never commit a real password). Idempotent re-run: an existing identity is reused, not duplicated. Document the pair in `docs/process/flow.md`'s accounts table (Admin row currently says "Seeded admin user" with no address). — not started

### US-021 Admin approves or rejects a farm · `done (evidence: packages/api/src/api/admin/farms/route.ts:120-128,194-219; packages/api/src/workflows/reveal-farm-pii.ts:19-27; packages/api/src/workflows/steps/pii-reveal.ts:15-71; packages/api/src/modules/pii-audit/service.ts:6-24; packages/api/src/workflows/steps/validate-seller-open.ts:28-33; packages/api/src/api/middlewares.ts:176-215; apps/admin-koi/src/components/FarmQueue.tsx:120-183,205-321,357-421; apps/storefront-koi/src/components/sections/AccountPage/FarmHomePage.tsx:34-44; packages/api/integration-tests/http/admin-farms.spec.ts:139-335; packages/api/integration-tests/http/pii-reveal.spec.ts:126-208; packages/api/integration-tests/http/farmer-auctions.spec.ts:283-315,604-630; qa PASS)`
**Depends on:** US-092 (masking and the logged reveal delivered here; column encryption stays open in US-092).
As an **admin**, I want to review farm registrations so that only real farmers
can create auctions. *(Plan: Becoming a farmer)*
**PII (D-039, D-042):** the queue shows masked NIK, bank account and phone, plus a reveal action to compare the KTP/NIK, bank account and phone with the applicant; every reveal is logged (D-042). US-092 delivers it.
- AC1: The queue shows the KTP photo, farm photos, and the bank account name versus the account holder's name. NIK, bank account and phone appear masked; the full value comes through the logged reveal (D-042).
- AC2: Approving gives farmer access. Rejecting needs a reason the applicant sees.
- AC3: Rejection is final, with no resubmission. It uses Mercur's `POST /admin/sellers/:id/suspend` with `reason` (sets `status_reason`, `rejected_at`). admin-koi never offers unsuspend for a rejected farm, because unsuspend goes straight to `open` (D-015).
- AC4: Farmer actions require `seller.status === open`. Mercur's `/vendor/*` doesn't check status, so our routes and workflows must.
- [x] T-021.1 [backend] `/admin` routes that use Mercur's seller approval workflow and, for rejection, the suspend workflow with a reason (D-015). Don't write new ones — `src/api/admin/farms/route.ts`, `src/api/middlewares.ts:176-215`; `admin-farms.spec.ts:201-335`
- [x] T-021.5 [backend] Shared check that a farmer's seller is `open`, used by every custom `/vendor/*` route and workflow (AC4; also US-030) — `src/workflows/steps/validate-seller-open.ts:16-34`; `farmer-auctions.spec.ts:283-315,604-630`
- [ ] T-021.6 [backend] Rejected-registration guard misses the pre-registration member token (empty `actor_id`), so `POST /vendor/sellers` hits Medusa's duplicate-metadata 500 instead of the guard's 400. Finality holds (nothing written), only the error shape is wrong. Fix so the guard runs for that token too — `src/workflows/hooks/seller-registration.ts:120-125`; spec exists at `integration-tests/http/admin-farms-rejection-stale-token.spec.ts` (reports `[low]`).
- [ ] T-021.2 [admin] `/kebun` queue screen
- [ ] T-021.3 [storefront] Farmer area appears once the seller is `open`. The member token comes from the re-login right after registration (D-030); whether approval needs yet another login is not verified, so check it at runtime
- [ ] T-021.4 [qa] An unapproved or rejected (suspended) seller can't reach farmer actions; the rejection reason shows to the farmer; no unsuspend in admin-koi

---

## Epic 3: Auctions for farmers (Milestone 3)

**Release risk to US-030's qa — closed 2026-11-15.** US-015 AC2 (extend
window) and US-014 AC3 (fee table) were accepted with those criteria carried
forward. US-030 AC6/AC7 (T-030.5/T-030.6/T-030.7) now prove both:
`packages/api/integration-tests/http/farmer-auctions.spec.ts:255-281` changes
the extend window and the fee table after creation and the stored values stay
the same. Fee recompute at submit (D-032) is proven by US-031 T-031.1
(`farmer-auctions.spec.ts:445-512`).

### US-030 Farmer creates an auction · `done (evidence: packages/api/integration-tests/http/farmer-auctions.spec.ts:154-224,226-253,255-281,283-315,317-347,349-416,445-512; qa PASS)`
As a **farmer**, I want to create an auction with lots so that customers can bid
on my koi. *(Plan: Structure, Pricing per lot, Fees, Delivery)*
- AC1: An auction has one category, a start and an end (1–7 days), and a delivery method (self-delivery or courier).
- AC2: Up to 20 lots. Each lot is one koi, with photos, OB (starting price) and KB (bid step), as integers. No reserve, no buy-it-now.
- AC3: Every lot belongs to the auction's category.
- AC4: The join fee and listing fee come from the fee table. The farmer can't set fees.
- AC5: A banned farmer can't create auctions. Only a seller with `status === open` can create one (US-021 AC4).
- AC6: *(Carried forward from US-015 AC2.)* The auction stores the extend window (`extend_window_minutes`) it was created with. A later settings change never alters an auction that already exists.
- AC7: *(Carried forward from US-014 AC3, changed by D-032.)* The auction stores its listing and join fees. They are computed from the fee table when the auction is created, and recomputed at every submit (US-031 AC2). A later fee-table change never alters an auction that is `scheduled` or later.
- AC8: A new auction starts as `draft`. The farmer can edit it until submit (US-031) (D-031).
- [x] T-030.1 [backend] Auction module: `auction` (farmer, category, start, end, join fee, listing fee, delivery method, status enum `draft | pending_approval | scheduled | live | closed | cancelled` (D-031), payer `customer_id` (D-033), fee override with reason (D-032), rejection reason (D-031), extend window snapshot (US-015 AC2), fee snapshot (US-014 AC3)), `lot` (OB, KB, current price, end time, winner, final price, status enum incl. `cancelled` with cancel reason (D-035)). Links to seller and product — `farmer-auctions.spec.ts:154-224`
- [x] T-030.2 [backend] Create-auction workflow that checks the limits from US-015, snapshots the current extend window and the category's fees onto the auction — `farmer-auctions.spec.ts:154-224,317-347`
- [x] T-030.3 [storefront] Farmer area: create auction and add lots with photos — `apps/storefront-koi/src/components/sections/AccountPage/CreateAuctionPage.tsx`; storefront-koi `bun run check` (129 tests) clean; browser screenshot `/tmp/koi-qa/10-create-auction-form.png` (read-only fees)
- [x] T-030.4 [qa] Limits enforced on the server, not only in the form — `farmer-auctions.spec.ts:317-347` (21 lots, `ob` 1.5, empty photos, fee in body all 400)
- [x] T-030.5 [qa] *(moved from T-015.3)* Changing the extend window doesn't change an existing auction's stored window — `farmer-auctions.spec.ts:255-281`
- [x] T-030.6 [backend] *(moved from T-014.2)* Auctions store their listing and join fees (recomputed at submit in T-031.1, D-032) — `farmer-auctions.spec.ts:255-281,445-512`
- [x] T-030.7 [qa] *(moved from T-014.4)* Editing a fee doesn't change a `scheduled` or later auction's fees — `farmer-auctions.spec.ts:255-281`
- [x] T-030.8 [backend] **Required before US-050.** Editing a draft's `end_at` doesn't update its existing lots' `end_time`: `updateDraftAuctionStep` (`packages/api/src/workflows/steps/auction.ts:436-485`) updates only the auction. Once US-050 closes lots on `end_time`, those lots would close at the old time. Fix so the lots' `end_time` follows the auction's `end_at` in the same workflow, with compensation, and add a test. Found after acceptance; US-030 stays `done`. — `farmer-auctions.spec.ts:392-408` (lots follow the new `end_at`, a lot added later takes it), `:483-528` (forced failure, compensation restores old `end_time`); farmer-auctions 11 passed

### US-031 Farmer submits an auction; listing fee charged at approval · `done (evidence: packages/api/integration-tests/http/farmer-auctions.spec.ts:445-512,553-602; packages/api/integration-tests/http/admin-auction-approval.spec.ts:162-184,186-201,203-222,259-305; apps/storefront-koi/src/components/sections/AccountPage/components/SubmitAuctionButton.tsx:67-82; apps/admin-koi/src/lib/helpers/auction-format.ts:49; qa PASS)`
As the **platform**, I want the listing fee checked when a farmer submits an
auction and charged when the admin approves it, so that farmers pay only for
auctions the platform accepts. *(Plan: How credit moves 5, Fees, Key flows: approve auction; D-020, D-031, D-032, D-033)*
**Depends on:** US-030 (auction exists), US-032 (the charge runs inside its approve workflow).
- AC1: Submit moves the auction `draft → pending_approval` (D-031).
- AC2: Submit recomputes the fees from the current fee table: listing fee = the category's listing fee × number of lots; join fee = the category's join fee (D-032).
- AC3: Submit saves the farmer's `customer_id`, read from the member token's `app_metadata` (mvp-Q15; verify at runtime in this story), on the auction (D-033).
- AC4: At submit, a balance below the recomputed listing fee refuses the submission with a "top up" prompt, and nothing changes (status, fees and `customer_id` stay as they were).
- AC5: Approval records one `listing_fee` (−) on the wallet of the `customer_id` saved on the auction, at the final fee: the recomputed fee, or the admin's override for this auction (US-032 AC3).
- AC6: Approval re-checks that wallet's balance. If it's below the final fee, approval fails with a clear error, and nothing is saved (no charge, the auction stays `pending_approval`).
- AC7: All or nothing: the charge and `pending_approval → scheduled` are saved together, or neither is.
- AC8: Nothing is charged before approval, so rejecting an auction or lowering its fee never writes a refund (D-020).
**mvp-Q15 verified at runtime:** the member token's `app_metadata` carries the same identity's `customer_id` (`farmer-auctions.spec.ts:496`; qa also confirmed in the dev DB).
- [x] T-031.1 [backend] Submit workflow (`draft → pending_approval`): recompute fees, save `customer_id`, balance check (AC1–AC4) + store/vendor route — `farmer-auctions.spec.ts:445-512,553-602`
- [x] T-031.4 [backend] Balance re-check + `listing_fee` charge steps inside US-032's approve workflow, with compensation (AC5–AC7) — `admin-auction-approval.spec.ts:162-184,186-201,203-222`
- [x] T-031.2 [storefront] Submit action in the Farmer area; short-balance prompt that links to top-up — `SubmitAuctionButton.tsx:67-82`; storefront-koi `bun run check` clean; screenshot `/tmp/koi-qa/31-after-submit.png`
- [x] T-031.5 [admin] Clear error in the `/lelang` queue when approval fails on a short balance — `apps/admin-koi/src/lib/helpers/auction-format.ts:49`, `auction-format.test.ts:56`; admin-koi `bun run check` (28 tests) clean
**D-055 sweep (2026-11-16):** T-031.1/T-031.2: `insufficient_balance` on submit is English in source (`steps/listing-fee.ts:21`) and the storefront shows it **verbatim** to the farmer (`auction-submit.ts:18`) — breaks D-055. T-031.4/T-031.5: the same English message is embedded inside admin-koi's Indonesian sentence (`auction-format.ts:51-52`) — mixed language.
- [x] T-031.3 [qa] A failure after the charge rolls it back; a short balance refuses submission and approval and writes nothing; resubmitting after a category or lot change recomputes the fees; the charge lands on the saved `customer_id`'s wallet; rejection and a lowered fee write no refund — `farmer-auctions.spec.ts:445-512,553-602`; `admin-auction-approval.spec.ts:186-222,259-305`. Not verified: two truly concurrent approvals (a sequential second approve gets 409 and charges nothing, `admin-auction-approval.spec.ts:179-184`)

### US-032 Admin approves or rejects auctions · `done (evidence: packages/api/integration-tests/http/admin-auction-approval.spec.ts:131-160,162-184,224-257,259-305; apps/admin-koi/src/components/AuctionQueue.tsx; apps/storefront-koi/src/components/sections/AccountPage/components/EditAuction.tsx:76,226; qa PASS)`
As an **admin**, I want to approve each auction before it's scheduled so that
category, photos and fees are checked. *(Plan: Structure, Fees; D-020, D-031, D-032)*
- AC1: The queue lists only `pending_approval` auctions, with category, lots with photos, and fees (D-031).
- AC2: Approving moves `pending_approval → scheduled` and charges the listing fee in the same workflow (US-031).
- AC3: Admin can override the listing or join fee for this one auction, with a saved written reason. The listing-fee charge uses the overridden fee (D-020).
- AC4: Rejecting needs a written reason. The auction moves `pending_approval → draft`, the farmer sees the reason, fixes it and resubmits. No rejected status (D-031).
- AC5: Rejecting clears any fee override. The admin applies it again at approval if it's still wanted (D-032).
- AC6: *(Follow-up, D-049.)* Approving an auction whose `start_at` is now or in the past is refused with a clear error. Nothing is charged and the auction stays `pending_approval`; the admin rejects it with a reason so the farmer picks new dates.
- [x] T-032.1 [backend] Approve workflow + fee override with a reason + `/admin` routes — `admin-auction-approval.spec.ts:162-184,224-257`
- [x] T-032.4 [backend] Reject workflow: saves the reason, clears the override, moves `pending_approval → draft` (D-031, D-032) + `/admin` route — `admin-auction-approval.spec.ts:259-305`
- [x] T-032.2 [admin] `/lelang` approval queue (filters on `pending_approval`) with approve, override and reject-with-reason — `apps/admin-koi/src/components/AuctionQueue.tsx`; admin-koi `bun run check` clean; screenshots `/tmp/koi-qa/42-admin-queue.png`, `51-after-approve.png`, `61-after-reject.png`
- [x] T-032.5 [storefront] Farmer area: show the rejection reason on the draft and let the farmer edit and resubmit — `EditAuction.tsx:76,226`; `admin-auction-approval.spec.ts:285-305`; screenshot `/tmp/koi-qa/21-draft-detail.png`
- [x] T-032.3 [qa] An override or a rejection without a reason is refused; a rejected auction is `draft` with the reason visible to its farmer and no override; a `draft` auction never shows in the queue; no status outside the plan's enum is written — `admin-auction-approval.spec.ts:131-160,224-257,259-305`
- [x] T-032.6 [backend] *(Follow-up, AC6, D-049.)* In `approveAuctionWorkflow` (`packages/api/src/workflows/decide-auction.ts`), refuse when `start_at <= now`: `MedusaError` `INVALID_DATA` (400) with code `start_passed`, checked before the wallet lock and charge. Add `start_at` to what the approve path reads (`getPendingAuctionStep`, `steps/auction.ts:304-337`, is shared with reject; reject must keep working on a passed start). Spec in `admin-auction-approval.spec.ts`: a `pending_approval` auction with a past `start_at` → 400 `start_passed`, no `listing_fee` row, status still `pending_approval`; rejecting the same auction still works. No route shape change, no codegen. — `steps/auction.ts:340-348` (`refuse_started`), `decide-auction.ts` approve passes it before the payer read, wallet lock and charge; `admin-auction-approval.spec.ts:203-223`; browser: past-start approve → 400, 0 `listing_fee` rows, still `pending_approval`, reject works
- [x] T-032.7 [admin] *(Follow-up, AC6.)* `/lelang`: map code `start_passed` in `auctionApproveErrorMessage` (`apps/admin-koi/src/lib/helpers/auction-format.ts:49`) to a clear Indonesian message that tells the admin to reject with a reason so the farmer picks new dates; add a case to `auction-format.test.ts`. `bun run check` clean. — `auction-format.ts:54-56`, `auction-format.test.ts:61-66`; admin-koi `bun run check` (29 tests) clean; browser toast shows the Indonesian message
**D-055 sweep (2026-11-16):** T-032.6/T-032.7: `start_passed` (admin-only) is English in source (`steps/auction.ts:347`); admin-koi translates it client-side (`auction-format.ts:54-56`), so the admin reads Indonesian.
**Follow-up (2026-11-15):** T-032.6 and T-032.7 were added after acceptance (`mvp-Q31` → D-049). US-032 stays `done`. Both were qa-verified and product-owner-accepted on 2026-11-16 (commit `c323956`); AC6 is now proven (`admin-auction-approval.spec.ts:203-223` 400 `start_passed`, no fee row, still `pending_approval`; reject path still works; admin-koi toast).

### US-033 Auctions start and farmers track them · `done (evidence: packages/api/src/modules/auction/models/auction.ts:6-13; packages/api/src/jobs/start-auctions.ts; packages/api/src/workflows/start-auction.ts; packages/api/integration-tests/http/auction-start-job.spec.ts:83-105; packages/api/integration-tests/http/admin-auction-approval.spec.ts:203-223,282-305; apps/storefront-koi/src/components/sections/AccountPage/FarmHomePage.tsx:212-241; apps/storefront-koi/src/lib/helpers/auction-status.ts:16-28,33-40; live job tick in dev DB scheduled → live, log "found 1, started 1"; screenshot .playwright-mcp/qa-us033-farm-beranda-tabs.png; qa PASS)`
As a **farmer**, I want to see my auctions and their status so that I know
what's live. *(Plan: Design rules, statuses)*
- AC1: Statuses follow `draft → pending_approval → scheduled → live → closed | cancelled`. A rejected auction returns `pending_approval → draft`; there is no rejected status (D-031).
- AC2: A scheduled auction becomes `live` at its start time automatically.
- [x] T-033.1 [backend] Scheduled job moves `scheduled → live` (idempotent, batched, logs a summary) — `src/jobs/start-auctions.ts` (pages of 50, per-id try/catch, summary log), `src/workflows/start-auction.ts` (lock `auction:<id>`, guard, `setAuctionFieldsStep`); auction-start-job + admin-auction-approval 11 passed; real minute tick in dev DB: scheduled → live at 21:49:09, log `found 1, started 1`, lot untouched
- [x] T-033.2 [storefront] Farmer area: my auctions list with status — `FarmHomePage.tsx:212-241` (Semua + six D-031 tabs, `aria-current`), `auction-status.ts:16-28,33-40`; storefront-koi `bun run check` (131 tests) clean; browser all 7 tabs filter, screenshot `.playwright-mcp/qa-us033-farm-beranda-tabs.png`; render check 25 loads, 0 hydration errors from our code (remaining intermittent `useId` mismatch is the known upstream React issue, `.claude/skills/render-check/SKILL.md` "Known upstream issue", not blocking)
- [x] T-033.3 [qa] Job is safe to run twice — `auction-start-job.spec.ts:83-105` (second run: `updated_at` identical, workflow returns `started: false`). Not verified: one bad row not stopping the batch (code read only, `start-auctions.ts:36-46`); two truly concurrent ticks (guarded by the per-auction lock + re-check, not run)

**Readiness (2026-11-15):** ready. No open question blocks it. AC1 is D-031's enum, which already exists (`packages/api/src/modules/auction/models/auction.ts:5-12`). AC2 is a plan Key flow. `mvp-Q31` is answered (D-049): approval refuses a passed `start_at` (US-032 T-032.6). The job is unchanged.
**Lots: the job does not touch them.** Lots are created `open` with `end_time` = the auction's end (`packages/api/src/workflows/steps/auction.ts:207-226`). The plan's lot lifecycle starts at "Open for bids" and has no state before it. Closing (`open → unsold | won`) and `live → closed` belong to US-050 (T-050.1, T-050.2). Because a lot is `open` while its auction is still `scheduled`, the bid gate must check that the **auction** is `live`, not the lot's status (US-042).
**Was a gap; now closed.** Editing a draft's `end_at` didn't update its existing lots' `end_time`. T-030.8 fixed it (commit `c323956`, `farmer-auctions.spec.ts:392-408,483-528`): lots follow the auction's new `end_at`, with compensation. US-050 can rely on `lot.end_time`.

#### Briefs

```text
Story: US-033 (task T-033.1)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria
- AC1: Statuses follow `draft → pending_approval → scheduled → live → closed | cancelled`. A rejected auction returns `pending_approval → draft`; there is no rejected status (D-031).
- AC2: A scheduled auction becomes `live` at its start time automatically.

## Decisions in force
D-031: the enum and its transitions. This job writes only `scheduled → live`.
CLAUDE.md §8/§9: every mutation is a workflow with compensation; jobs fetch by id, run a workflow, are idempotent and batch.

## Build
- `src/jobs/start-auctions.ts`, schedule `* * * * *`. Read the ids of auctions with
  `status = scheduled` and `start_at <= now` through query.graph. Confirm the `$lte`
  filter in the Medusa docs; if it isn't supported, say so before you improvise.
  Process the ids in chunks of 50. Run `startAuctionWorkflow` once per id. A failure
  on one id is logged and the job continues with the rest. Finish with one logger
  line: found / started / skipped / failed.
- `src/workflows/start-auction.ts`: lock `auction:<id>` (same key as approve), then
  a guard step that re-reads the auction and skips (does not throw) unless it is
  still `scheduled` with `start_at <= now`, then reuse `setAuctionFieldsStep`
  ({ status: "live" }, which has compensation built in), then release the lock.
- Lots are NOT touched (see Readiness above).

## Start from
- packages/api/src/workflows/decide-auction.ts:31-37,91-96 (lock key + release pattern; import only)
- packages/api/src/workflows/steps/auction.ts:304-340 (guard-step shape), :356-388 setAuctionFieldsStep (reuse by import)
- packages/api/src/jobs/README.md (job file shape)
- packages/api/integration-tests/http/admin-auction-approval.spec.ts:48-110 (seeding a seller + auction directly)

## Do not touch
- apps/** (no frontend in this task)
- packages/api/src/workflows/{decide-auction,submit-auction,create-auction,update-draft-auction,draft-auction-lots}.ts,
  src/workflows/steps/{auction,listing-fee}.ts, src/api/vendor/auctions/**, src/api/admin/auctions/** (import only, no edits)
- docs/

## Spec
packages/api/integration-tests/http/auction-start-job.spec.ts. Call the job's default export with getContainer():
- scheduled + start in the past → live; lots unchanged (status `open`, same end_time)
- scheduled + start in the future → stays scheduled
- draft / pending_approval / cancelled with start in the past → unchanged
- run the job twice → second run changes nothing, no error

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                                   → clean
cd packages/api && bun run test:integration:http -- auction-start-job        → pass (alone)
No route changed, so no codegen.
Report: standard header + the job's log line from a run.

## Open questions
none
```

```text
Story: US-033 (task T-033.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min

## Acceptance criteria
- AC1 (shown to the farmer): each auction shows its status label from the D-031 enum; no other status is invented.
- AC2 (visible result): a scheduled auction shows "Live" once the job has run. No client-side status flipping: show what the server returns.

## Decisions in force
D-003: member token + x-seller-id through the existing vendorHeaders().
D-005: @koi/ui components only. Typed @mercurjs/client only, never raw fetch.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /vendor/auctions?limit&offset&status | yes, packages/api/src/api/vendor/auctions/route.ts:152-180; validators.ts status enum | { auctions: (VendorAuction & { lot_count })[], count, limit, offset } |

## Build
Turn the minimal list in FarmHomePage into the status tracker:
- status filter tabs: Semua + the six statuses, using auctionStatusLabel; sent as `status` to the route
- pagination from `count`
- each row: lot count, start–end as date + time (id-ID), status badge
Keep the existing Ubah/Lihat links and the draft submit button as they are.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/FarmHomePage.tsx:173-262 (MyAuctions)
- apps/storefront-koi/src/lib/data/auctions.ts:125-136 getMyAuctions: add an optional status argument
- apps/storefront-koi/src/lib/helpers/auction-status.ts (labels; has a test)
- the FeedPagination / FeedFilters cells already used by the lelang feed

## Do not touch
- packages/api/**, apps/admin-koi/**
- SubmitAuctionButton.tsx, CreateAuction*.tsx, EditAuction*.tsx, akun/kebun/lelang/**

## Definition of done
cd apps/storefront-koi && bun run check                            → pass
Browser check (render-check skill / playwright MCP): http://127.0.0.1:3001/akun/kebun/beranda signed in as sakura.koi.farm@koi.dev; filter to one status, then page
Note: that login is now a full dual-actor demo farmer — customer row, wallet (Rp500.000), member and `open` seller (`seed-koi.ts:701-710,911-981`, T-020.9, commit `1dc43de`). Sign in with it directly; no hand-made farmer account needed.
Report: standard header + screenshot path.

## Open questions
none
```

```text
Story: US-033 (task T-033.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1, AC2. Decisions: D-031.
Code under test: packages/api/src/jobs/start-auctions.ts, src/workflows/start-auction.ts, FarmHomePage.tsx.
Commands (alone, nothing else on Jest): cd packages/api && bun run test:integration:http -- auction-start-job;
cd apps/storefront-koi && bun run check.
Watch for: the job writing any status except `live`; touching lots; a second run writing again;
one bad row stopping the batch; a draft/pending auction going live.
Browser: the Farmer area list shows Live after the job runs on a seeded scheduled auction whose start is in the past.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

---

## Epic 4: Joining and bidding (Milestone 4)

### US-040 Customer browses real auctions · `done (evidence: packages/api/integration-tests/http/store-lots.spec.ts:153-410 (8/8); packages/api/src/api/store/lots/route.ts:80,105-125; apps/storefront-koi/src/lib/data/lots.ts:67,175; apps/storefront-koi/src/components/sections/LotDetailsPage/components/LotPage.tsx:83,243-251; LotDetailsPage.tsx:26 (real 404); storefront bun run check pass (161 tests); browser closed-sold/unsold/cancelled and tab counts; qa PASS)`
As a **customer**, I want to browse live and upcoming auctions and their lots so
that I can choose what to bid on. *(Plan: Milestone 4)*
- AC1: `lelang` and lot pages show API data. The demo constants are removed.
- AC2: Each lot shows photos, OB, KB, current price and time left.
- AC3: Lots of `scheduled`, `live` and `closed` auctions are public; `draft`, `pending_approval` and `cancelled` auctions never are. A closed lot shows its final price and "Terjual" or "Tidak terjual", never who won: no winner field of any kind on a public route or page (D-046). A cancelled lot inside a public auction stays visible, labelled "Dibatalkan", with no price, no final price, no sold label, no winner and no bids (D-050).
- [x] T-040.1 [backend] Public store routes `GET /store/lots` and `GET /store/lots/:id` (the storefront is lot-centric: `lelang` lists lots, and `/lelang/[id]` takes a lot id) — built 2026-11-16, qa PASS 2026-11-16 (committed in `c323956`; `store-lots.spec.ts` 8 specs pass per backend report)
- [x] T-040.2a [storefront] `lib/data/lots.ts` + `lib/adapters/lot.ts` (+ test); the `lelang` feed on API data — built 2026-11-16, qa PASS 2026-11-16 (uncommitted; `lot.test.ts` 5 cases, cancelled-lot card). **Browser render NOT verified**: the app container can't launch chromium; only `curl` was run. qa must run the render check on `/lelang`.
- [x] T-040.2b [storefront] The lot page `/lelang/[id]` on API data (photos, OB, KB, current price, time left); remove the demo lots from `const/auctions.ts`
- [x] T-040.2c [storefront] Home page hero and lot strip on API data (`const/home.ts` demo lots link to ids `1…n`, which 404 once T-040.2b lands)
- [x] T-040.3 [qa] No demo data left in auction views

**Readiness (2026-11-15):** ready. `mvp-Q28` answered (D-046): public statuses are `scheduled`, `live` and `closed`; closed lots show final price and sold/unsold, never the winner; the "Selesai" tab stays. `mvp-Q32` answered (D-050): a cancelled lot inside a public auction stays visible as "Dibatalkan", with no price, no final price, no sold label, no winner and no bids. No lot can be cancelled before US-091, so the tasks build it now (flag, labels) and US-091 only produces the cancelled lots.
**Known interim:** the live room (`/live`) keeps its demo lots until US-046 T-046.2. Its tiles link to demo ids, which 404 once T-040.2b lands. Accepted until US-046 and recorded here so qa doesn't fail US-040 on it.
**Interpretation of AC2, for qa:** the lot page shows all five (photos, OB, KB, current price, time left). The feed card keeps photo, current price and time left. OB and KB are on the lot page.
**Out of this story:** bids, bid counts and bidder names (US-044), join (US-041), the live room's demo data (US-046 T-046.2), the cart demo (fixed-price cart is out of MVP scope).

#### Briefs

```text
Story: US-040 (task T-040.1)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria
- AC1: `lelang` and lot pages show API data. (Backend part: the routes those pages read.)
- AC2: Each lot shows photos, OB, KB, current price and time left. (Backend part: the response carries them.)
- AC3: Lots of `scheduled`, `live` and `closed` auctions are public; never `draft`, `pending_approval`, `cancelled` auctions. A closed lot returns final price and sold/unsold, never any winner field (D-046). A cancelled lot inside a public auction is returned too, with `cancelled: true` and null price fields (D-050).

## Decisions in force
D-017: seller payment_details, professional_details and custom_fields (KTP, NIK) never appear on a /store route.
D-039 / D-045: no one else's PII in a store response. A public route returns no phone, email, bank or NIK for anyone.
D-044: the farmer's bank details reach only the winner, through US-051's reveal. Never here.
D-032: the join fee shown is the final one: fee_override_join_fee ?? join_fee.
D-046: PUBLIC_AUCTION_STATUSES = ["scheduled", "live", "closed"] in one constant. A closed lot returns final_price and
  sold; never winner_customer_id or any other winner field.
D-050: a cancelled lot (lot status `cancelled`, D-035) inside a public auction is still listed. It returns
  cancelled: true, and current_price, final_price and sold are all null. No bids for it. Its auction status still
  decides visibility; a `cancelled` auction is never public.

## Build (reads only, query.graph, no workflow)
Response shape (the storefront brief pins it):
  StoreLot = {
    id, title: string|null, description: string|null, photos: string[],
    ob, kb, current_price: number|null (null when the lot is cancelled), end_time (ISO),
    final_price: number|null   (null while the lot is open, and when cancelled),
    sold: boolean|null         (null while open, and when cancelled; true for won/paid/shipped/delivered/claimed; false for unsold),
    cancelled: boolean         (true when the lot status is `cancelled`, D-050),
    auction: { id, status, start_at, end_at, join_fee, delivery_method,
               category: { id, name } | null,
               seller: { id, name, handle } | null }
  }
  GET /store/lots?limit&offset&status → { lots: StoreLot[], count, limit, offset }, default limit 20, max 100.
    status = auction status, one of PUBLIC_AUCTION_STATUSES (anything else → 400). No status → scheduled + live,
    ordered by end_time ASC. status=closed → closed auctions' lots, ordered by end_time DESC (newest result first).
  GET /store/lots/:id → { lot: StoreLot }; 404 when the lot is missing OR its auction isn't public (a draft lot id must not leak)
    A lot cancelled inside a public auction is 200, with cancelled: true (D-050).
The raw lot status is not returned (won/paid/shipped would tell about the winner); `sold` and `cancelled` are the only
  result flags. `cancel_reason` stays private.
Never selected: payer_customer_id, winner_customer_id, listing_fee, fee_override_*, rejection_reason,
  cancel_reason, extend_window_minutes, any seller field other than id/name/handle.
Filtering lots by auction status: try a same-module relation filter on `lot` (filters: { auction: { status } }).
  If query.graph won't do it, query `auction` by status with nested lots and flatten/sort/slice in memory, with a
  `ponytail:` comment (ceiling: a few hundred public auctions; upgrade: SQL or the Index module). Say which one you used.
Category: one batched fee_category read (no link exists), same as toAdminAuctions.
Photos/title: lot → product readOnly link (product.title, product.description, product.images.url).
Store routes need the publishable key only. No customer auth: the pages are public.
Write the mapper in the store route file. Don't import from src/api/vendor/** (different, private shape).

## Start from
- packages/api/src/api/admin/auctions/route.ts:40-75 (batched category read + lot mapping, copy the idea, don't import)
- packages/api/src/api/vendor/auctions/route.ts:100-125 (product.title / product.images.url fields)
- packages/api/src/links/{auction-seller,lot-product}.ts (readOnly links Query walks)
- packages/api/src/api/middlewares.ts:242-245,325-328 (storePiiMask + seller-field guard already on all of /store; add validateAndTransformQuery entries next to /store/wallet :265-278)
- integration-tests/http/admin-topup-requests.spec.ts:70-80 (publishable key in a spec)

## Do not touch
- apps/**
- src/modules/auction/models/** (no schema change in this task)

## Spec
packages/api/integration-tests/http/store-lots.spec.ts:
- a live and a scheduled auction's lots are listed, ordered by end_time; lots of draft / pending_approval / cancelled auctions and closed auctions' lots are not (no status)
- a cancelled lot (D-050) inside a live auction, in both the list and GET /store/lots/:id: 200, cancelled true, current_price, final_price and sold all null, and no cancel_reason; same for one inside a closed auction, listed under status=closed
- status=closed lists a closed auction's lots: a won lot with final_price set and sold true, an unsold lot with sold false
- status=cancelled or status=draft → 400
- GET /store/lots/:id: 200 for a public lot, including a closed one; 404 for a draft and a cancelled auction's lot
- a closed lot whose winner_customer_id is set: neither the list nor GET /store/lots/:id contains the substring "winner"
  (no winner key of any kind) or the winner's customer id value
- join_fee = the override when set
- JSON.stringify(response) contains none of: payment_details, custom_fields, professional_details, phone, email,
  payer_customer_id, winner_customer_id, listing_fee, fee_override_reason

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                         → clean
cd packages/api && bun run codegen                                 → routes.d.ts has store.lots
cd packages/api && bun run test:integration:http -- store-lots     → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (method, path, query, response, errors).

## Open questions
none (mvp-Q28 answered, D-046)
```

```text
Story: US-040 (task T-040.2a)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-040.1 has delivered its contract and codegen.

## Acceptance criteria
- AC1: `lelang` and lot pages show API data. The demo constants are removed. (This task: the `lelang` feed.)
- AC2: Each lot shows photos, OB, KB, current price and time left. (Card: photo, current price, time left.)
- AC3: A closed lot shows final price and "Terjual" / "Tidak terjual" under "Selesai", never who won (D-046). A cancelled lot shows "Dibatalkan" and no price (D-050).

## Decisions in force
D-005 @koi/ui; typed @mercurjs/client only; D-039 nothing beyond seller name/handle is shown; money id-ID via formatPrice.
D-046: keep the "Selesai" tab. A closed lot shows final price and "Terjual" / "Tidak terjual", never the winner.
D-050: a cancelled lot (lot status `cancelled`, D-035) stays in the feed, labelled "Dibatalkan", with no price, no final price, no sold label and no bids. Its auction may be scheduled, live or closed.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots?limit&offset&status | no → T-040.1 (ordered first) | { lots: StoreLot[], count, limit, offset }; no status = scheduled + live, status=closed = results |
| GET | /store/lots/:id | no → T-040.1 | { lot: StoreLot } (used by T-040.2b) |

## Build
- src/lib/data/lots.ts: listLots({ limit = FEED_LIMIT, status? }) and getLot(id), both `cache: 'no-store'`. getLot returns null on 404.
- src/lib/adapters/lot.ts: StoreLot → AuctionProduct. Cancelled (lot.cancelled, D-050) → status "cancelled",
  currentBid 0, cancelled: true, endsAt undefined (no clock). Otherwise: sold !== null (lot closed) → "ended"; else auction
  scheduled → "upcoming", live → "live". Ended: currentBid = final_price ?? current_price, plus a sold flag for the
  "Terjual" / "Tidak terjual" label. Otherwise currentBid = current_price. endsAt = end_time,
  image = photos[0], listing = { seller: auction.seller.name, sellerKind: "farm",
  category: auction.category.name, note: description }.
  Leave bidCount and bids undefined (no bids until US-044). Add a node:test file next to it (include the cancelled case).
- Add `openingBid` and `bidStep` (optional numbers) to AuctionState in src/types/product.ts, filled from ob/kb (T-040.2b renders them).
  Add `cancelled?: boolean` there too. Keep `currentBid` required: the adapter sets `currentBid: 0` for a cancelled lot
  (a cancelled lot is closed, so no bid, cart, terminal or sheet ever receives it — those readers are untouched) and
  the cancelled flag gates every place a price would render. One `ponytail:` note on the 0: ceiling is the four readers
  above; upgrade is making `currentBid` optional if a cancelled lot ever reaches one of them.
- Add `cancelled` to AuctionStatus (src/types/product.ts:25) with `{ label: "Dibatalkan", variant: "muted", pulse: false }`
  in AUCTION_STATUS (src/const/stamps.ts:50) and a `cancelled: "lot dibatalkan"` key in STATUS_LABEL
  (src/const/auctions.ts:268, `Record<AuctionStatus|"all">` forces it). No "Dibatalkan" tab: DEFAULT_AUCTION_TABS is
  explicit, leave it.
- AuctionProductCard: with `cancelled`, pass no `sale` to ProductFacts (the price row and "Bid" label disappear,
  ProductFrame.tsx:324) and no `trailing` (no tally, no clock). The status pill already says "Dibatalkan".
- Tabs: a cancelled lot appears under "Semua" only. The "Selesai" tab stays closed (ended) lots; there is no
  "Dibatalkan" tab (D-050).
- If this no longer fits 45 min, split it: T-040.2a keeps the data layer, adapter and test; a new
  T-040.2d [storefront] takes the `cancelled` status (types/product.ts, const/stamps.ts, const/auctions.ts) and the
  AuctionProductCard rendering. Say in the report which one you did.
- AuctionsPage (server) loads listLots() and listLots({ status: "closed" }) and passes both, joined, as `lots` down
  through AuctionsFeed → Auctions; the "Selesai" tab shows the ended ones. Never render a winner. Remove the
  DEFAULT_AUCTION_LOTS default from Auctions.tsx. Keep client-side filterGoods over the first FEED_LIMIT lots,
  like CategoryPage, with a `ponytail:` note (ceiling 100 lots; upgrade: server-side filter params).

## Start from
- src/components/sections/AuctionsPage/AuctionsPage.tsx, components/AuctionsFeed.tsx, components/Auctions.tsx:67-79
- src/lib/adapters/product.ts + product.test.ts (adapter + test pattern)
- src/components/sections/CategoryPage/CategoryPage.tsx:71 (FEED_LIMIT loader pattern)

## Do not touch
- packages/api/**, apps/admin-koi/**
- LivePage/**, const/live.ts (US-046), Cart/** (out of scope), akun/kebun/** (US-030–033)

## Definition of done
cd apps/storefront-koi && bun run check                        → pass
render-check skill on http://127.0.0.1:3001/lelang with a seeded live + scheduled auction: real lots, no picsum images
Report: standard header + screenshot path.

## Open questions
none
```

```text
Story: US-040 (task T-040.2b)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-040.2a (shares lib/data/lots.ts and lib/adapters/lot.ts).

## Acceptance criteria
- AC1: `lelang` and lot pages show API data. The demo constants are removed.
- AC2: Each lot shows photos, OB, KB, current price and time left. (The lot page shows all five.)
- AC3: A closed lot's page shows final price and "Terjual" / "Tidak terjual", never who won (D-046). A cancelled lot's page is a normal 200 page (not 404) showing "Dibatalkan" and no price (D-050).

## Decisions in force
Same as T-040.2a. D-050: a cancelled lot's page is a normal 200 page (not 404) showing "Dibatalkan" and no price, no
final price, no "Terjual" / "Tidak terjual", no winner and no bids.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots/:id | no → T-040.1 | { lot: StoreLot }; a cancelled lot inside a public auction is 200 |
| GET | /store/lots | no → T-040.1 | grid under the lot (same list as the feed) |

## Build
- app/(main)/lelang/[id]/page.tsx: generateMetadata uses getLot(id).
- LotDetailsPage (server) loads getLot(id) (null → notFound()) and listLots(), and passes lot, lots and
  media = photos.map(src => ({ src, kind: "image" })) to LotDossier → LotPage. LotDossier stops reading demo data.
- LotPage: render OB (openingBid) and KB (bidStep) with formatPrice next to the current price. A closed lot (D-046):
  final price and "Terjual" / "Tidak terjual" in place of the current price and countdown; no winner shown. A cancelled
  lot (D-050): "Dibatalkan" where the price and countdown sit, no price figure, no OB/KB price row, no bid controls, no
  bid history. Remove the
  DEFAULT_AUCTION_LOT / DEFAULT_AUCTION_LOTS / DEFAULT_LIVE_MEDIA defaults for lot, lots and media.
- const/auctions.ts keeps only UI config (DEFAULT_AUCTION_FILTER, _TABS, _SORTS, STATUS_LABEL). Delete DEFAULT_AUCTION_LOTS,
  DEFAULT_AUCTION_LOT, the demo bidders and bidsFor. Move what other screens still import:
  LiveRoom/LiveRoomPage → into const/live.ts with `ponytail:` "US-046 T-046.2 replaces";
  const/cart.ts → inline its one demo product; lib/helpers/filter-goods.test.ts → a local fixture in the test.

## Start from
- src/components/sections/LotDetailsPage/LotDetailsPage.tsx, components/LotDossier.tsx:21-36, components/LotPage.tsx:55-62,150-215
- src/components/cells/MediaGallery/MediaGallery.tsx:7-13 (MediaItem)
- grep -rn "const/auctions" src (every importer)

## Do not touch
- packages/api/**, apps/admin-koi/**, akun/kebun/**; don't rewire LiveRoom to the API (US-046)

## Definition of done
cd apps/storefront-koi && bun run check                                  → pass
grep -rn "DEFAULT_AUCTION_LOTS\|DEFAULT_AUCTION_LOT\b\|bidsFor" apps/storefront-koi/src → only const/live.ts (live room)
render-check skill on http://127.0.0.1:3001/lelang/<seeded lot id> and on an unknown id (404 page, no crash)
Report: standard header + screenshot paths.

## Open questions
none
```

```text
Story: US-040 (task T-040.2c)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=30 min
Starts after: T-040.2a (reuses listLots + the lot adapter).

## Acceptance criteria
- AC1: `lelang` and lot pages show API data. The demo constants are removed. (This task: the home page links into them, so it must not point at demo ids.)

## Decisions in force
Same as T-040.2a.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots?limit | no → T-040.1 | { lots: StoreLot[], count, limit, offset }; no status = scheduled + live only |

## Build
HomePage (server) loads listLots(SHELF_LIMIT) once. featured = the lot whose end_time comes first; lots = the rest.
Pass both into Landing → Home. With no lots, hide the hero card and the strip; don't fall back to demo data.
Delete DEFAULT_FEATURED / DEFAULT_LOTS from const/home.ts and the defaults in Home.tsx:51-52.
A cancelled lot can land in `lots`; it renders through the same card (no price, "Dibatalkan" pill, T-040.2a). Don't
filter it out.

## Start from
- src/components/sections/HomePage/HomePage.tsx (it already loads listSellers the same way), components/Landing.tsx, components/Home.tsx:51-52,125-150

## Do not touch
- packages/api/**, apps/admin-koi/**, the partner band (already on real sellers)

## Definition of done
cd apps/storefront-koi && bun run check                       → pass
render-check skill on http://127.0.0.1:3001/ ; the hero card links to a real /lelang/<lot id>
Report: standard header + screenshot path.

## Open questions
none
```

```text
Story: US-040 (task T-040.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1, AC2, AC3. Decisions: D-017, D-039, D-044, D-045, D-032, D-046, D-050.
Code under test: packages/api/src/api/store/lots/**, apps/storefront-koi/src/lib/{data/lots.ts,adapters/lot.ts}, AuctionsPage/**, LotDetailsPage/**, const/auctions.ts.
Commands (alone): cd packages/api && bun run test:integration:http -- store-lots; cd apps/storefront-koi && bun run check.
Browser (render-check): /lelang and /lelang/<id> signed out. Every lot is a seeded API lot; OB, KB, current price and countdown are on the lot page.
A seeded closed auction: its lots are under "Selesai" with final price and Terjual / Tidak terjual; no winner on the card or lot page.
A cancelled lot inside a public auction (seed one by hand if needed, D-050): still in the feed and its /lelang/<id> page is 200, labelled "Dibatalkan", no price, no final price, no Terjual label, no winner, no bids.
Watch for: any PII or private field in /store/lots responses (curl it and grep for phone/email/payment_details/custom_fields/
payer_customer_id/winner_customer_id/cancel_reason, and "winner" at all on a closed or cancelled lot); a draft, pending or cancelled auction's lot reachable by id; demo picsum images or "Sakai Fish Farm" left anywhere in /lelang.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-041 Customer joins an auction · `done (evidence: packages/api/integration-tests/http/join-auction.spec.ts:126-266 (12/12); packages/api/src/modules/auction/__tests__/auction-participant.spec.ts:33-63 (3/3); apps/storefront-koi/src/lib/helpers/join-auction.ts:72-81; JoinAuction.tsx:52-58,100-117; browser join wrote 1 participant + 1 join_fee −100000; qa PASS; ban clause → US-059, D-047)`
As a **customer**, I want to join an auction by paying the join fee once so that
I can bid on all its lots. *(Plan: Structure, Fair play, Strikes)*
- AC1: Join fee recorded as `join_fee` (−) once per auction. The participant is added in the same workflow.
- AC2: Short balance blocks joining with a "top up" prompt.
- AC3: Joining is allowed any time until the auction ends, including after bidding starts.
- AC4: A farmer can't join their own auction. A banned customer can't join. *(Ban clause delivered and verified by US-059 T-059.1, D-047; not checked in this story.)*
- [x] T-041.1a [backend] `auction_participant` model + migration (unique per auction + customer) — built 2026-11-16, qa PASS 2026-11-16 (committed in `c323956`; `Migration20261115211617.ts:10` unique index; `auction-participant.spec.ts` 3 cases)
- [x] T-041.1b [backend] Join workflow + `POST`/`GET /store/auctions/:id/join` (balance check, charge, participant) — built 2026-11-16, qa PASS 2026-11-16 (committed in `c323956`; `join-auction.spec.ts` 12 specs pass per backend report)
- [x] T-041.2 [storefront] Join button with the fee shown and a short-balance prompt
- [x] T-041.3 [qa] Joining twice charges once; own-auction users are blocked (banned users: US-059, D-047)
**D-055 sweep (2026-11-16):** T-041.1b: `insufficient_balance` (`steps/join-fee.ts:112,165`) and `own_auction` (`:61`) are English in source; T-041.2 translates them client-side (`join-auction.ts:72-87`), so the customer reads Indonesian. Backend copy to be translated when the join code is next touched; `already_joined`/`auction_not_joinable` are 409 (never shown).

**Readiness (2026-11-15):** ready. `mvp-Q29` answered (D-047) and `mvp-Q30` answered (D-048). Depends on US-040 (below). Where each rule comes from:
- **Charge:** plan "How credit moves" step 4 and Key flows "Join auction". One workflow checks the balance, records `join_fee` (−) and adds the participant, all or nothing. The amount is the final join fee, `fee_override_join_fee ?? join_fee` (D-032). The balance is a sum of the ledger, never a stored number (CLAUDE.md §8). The wallet row is locked with the same `wallet:<id>` key as approval and adjustments. No wallet (profile incomplete, D-011) counts as Rp0 and gets the top-up prompt.
- **Joining twice:** AC1 "once per auction". A database unique index on (auction_id, customer_id), plus a refusal before any charge (409 `already_joined`). Nothing is charged a second time.
- **Own auction:** plan Fair play, "A farmer cannot join or bid on their own auction". Checked by comparing the caller's customer id with `auction.payer_customer_id`, the farmer's customer id saved at submit (D-033). Every `scheduled`/`live` auction passed submit, so the field is always set. No customer↔seller link is needed (D-003). ponytail: a farm with a second member isn't caught. Upgrade path: also match seller members, when a farm can have more than one.
- **Closed auction:** AC3 / plan Structure, "any time until the auction ends". `draft`, `pending_approval`, `closed` and `cancelled` are refused. `scheduled` (before the start) and `live` are allowed, including while a lot runs past `end_at` on extends (D-048).
- **Banned customer:** AC4. No ban exists in the code yet. US-041 ships without a ban check; US-059 T-059.1 adds it to join (and bid) and US-059's qa verifies it (D-047). **Dependency note for qa:** don't fail US-041 on the ban clause.
- **No refund on leaving** (plan Cancellations): no leave route is built. Refunds on cancel are US-060 / US-091. They will find participants in this table and charges by `reference = auction_id`.
- Depends on US-040 (the lot page the button sits on, and `GET /store/lots/:id`).

#### Briefs

```text
Story: US-041 (task T-041.1a)   Release: mvp
Agent: backend   Expected: <=30 min

## Acceptance criteria
- AC1: Join fee recorded as `join_fee` (−) once per auction. The participant is added in the same workflow. (This task: the participant table and its once-per-auction constraint.)

## Decisions in force
plan "Custom modules": `auction_participant (customer, joined at)` lives in the auction module.
CLAUDE.md §9: soft reference `customer_id` (text), never a foreign key into another module. No link is added now (nothing reads participant → customer yet).

## Build
- src/modules/auction/models/auction-participant.ts: id prefix "apart", customer_id text, belongsTo auction
  (hasMany `participants` on Auction). created_at is the "joined at".
  Index: unique on [auction_id, customer_id], scoped to live rows like fee_category's name.
- Register the model in AuctionModuleService (service.ts) and export a DTO type.
- Migration: `medusa db:generate auction` (DATABASE_URL inline, see the koi-delivery skill).

## Start from
- packages/api/src/modules/auction/models/lot.ts (belongsTo + index shape)
- packages/api/src/modules/platform-settings/models/fee-category.ts:14 (unique index) and its migration :9 (partial unique index SQL)
- packages/api/src/modules/wallet/__tests__/wallet.spec.ts (module test runner)

## Do not touch
- the existing Auction/Lot columns, the existing migration Migration20261115115753.ts, src/workflows/**, src/api/**, apps/**

## Spec
packages/api/src/modules/auction/__tests__/auction-participant.spec.ts: a second participant row for the same
auction + customer is refused by the database; the same customer in another auction is fine.

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                      → clean
cd packages/api && bun run test:integration:modules -- auction-participant → pass (alone)
cd packages/api && npx medusa db:migrate (inside the container)  → migration applied
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the generated migration file name.

## Open questions
none
```

```text
Story: US-041 (task T-041.1b)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: T-041.1a.

## Acceptance criteria
- AC1: Join fee recorded as `join_fee` (−) once per auction. The participant is added in the same workflow.
- AC2: Short balance blocks joining with a "top up" prompt.
- AC3: Joining is allowed any time until the auction ends, including after bidding starts.
- AC4: A farmer can't join their own auction. (Ban part: delivered by US-059 T-059.1, D-047. Not in this task.)

## Decisions in force
D-032: fee = fee_override_join_fee ?? join_fee.
D-033: auction.payer_customer_id = the farmer's customer id (own-auction check).
D-047: no ban check in this task. D-048: joinable while status is scheduled or live, also past end_at.
D-011 / D-019 spirit: no wallet = Rp0. The balance never goes below Rp0 (check under the lock).
CLAUDE.md §8: ledger append-only; balance = SUM; lock the wallet; every mutation in a workflow.

## Build
src/workflows/join-auction.ts (input: auction_id, customer_id from req.auth_context.actor_id):
  1. acquireLockStep `auction-join:<auction_id>:<customer_id>`
  2. guard step (read-only): the auction exists (404); its status is scheduled or live, otherwise 409 code
     `auction_not_joinable` (D-048: no end_at check); payer_customer_id !== customer_id (403 code `own_auction`);
     not already a participant (409 code `already_joined`). Returns the fee and the customer's wallet id.
  3. acquireLockStep `wallet:<wallet_id>` (same key as decide-auction.ts:57-62)
  4. balance check step: SUM via walletBalance(); short → 400 code `insufficient_balance`, message names the join fee
  5. create participant step (compensation: delete it)
  6. charge step: append `join_fee`, amount −fee, reference = auction_id, created_by = customer_id. Last mutation,
     no compensation (same reasoning as chargeListingFeeStep).
  7. release both locks
  Fee Rp0 (an admin override): still adds the participant. Write no Rp0 ledger row; say so in a comment.
  New steps go in src/workflows/steps/join-fee.ts. Don't edit steps/listing-fee.ts; import walletBalance from api/store/wallet/route.ts.
Routes: src/api/store/auctions/[id]/join/route.ts
  POST → 201 { participant: { auction_id, joined_at }, wallet_transaction_id }
  GET  → { joined: boolean, join_fee: number }
  Both: authenticate("customer", ["bearer","session"]) in middlewares.ts. Identity only from auth_context. No body (POST strict empty).
Ban (D-047): no ban step. Leave a `ponytail:` in the guard naming US-059 T-059.1 as the place the ban check lands.

## Start from
- packages/api/src/workflows/decide-auction.ts:31-99 (lock order, balance check, last-mutation charge)
- packages/api/src/workflows/steps/listing-fee.ts:12-65 (copy the shape; don't edit)
- packages/api/src/api/store/wallet/route.ts:28-36 walletBalance
- packages/api/src/api/middlewares.ts:265-278 (customer auth on a store route)
- integration-tests/http/admin-auction-approval.spec.ts:48-110 (seeding farmer, auction, wallet)

## Do not touch
- apps/**; src/workflows/{decide-auction,submit-auction,create-auction,update-draft-auction,draft-auction-lots}.ts,
  steps/{auction,listing-fee}.ts; src/api/vendor/**, src/api/admin/auctions/**; src/api/store/lots/** (US-040)

## Spec
packages/api/integration-tests/http/join-auction.spec.ts:
- live auction, balance ≥ fee → 201; one `join_fee` row = −fee with reference = auction id; balance drops by fee
- scheduled auction → allowed (AC3, before the start)
- live auction with end_at in the past (a lot in extension) → allowed (D-048)
- second POST → 409 already_joined; still one ledger row
- two concurrent POSTs → exactly one 201, one ledger row
- balance < fee → 400 insufficient_balance; no participant, no ledger row
- no wallet → 400 insufficient_balance
- override join fee used when set
- caller = the auction's payer customer → 403 own_auction
- draft / pending_approval / closed / cancelled → 409 auction_not_joinable
- no customer token → 401
- GET reports joined true/false

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                          → clean
cd packages/api && bun run codegen                                  → routes.d.ts has store.auctions.$id.join
cd packages/api && bun run test:integration:http -- join-auction    → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (both routes, error codes).

## Open questions
none (mvp-Q29 → D-047, mvp-Q30 → D-048)
```

```text
Story: US-041 (task T-041.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-041.1b contract + US-040 T-040.2b (the lot page).

## Acceptance criteria
- AC1: Join fee recorded as `join_fee` (−) once per auction. (UI: the fee is shown before joining; after joining the page shows "Sudah ikut", not the button.)
- AC2: Short balance blocks joining with a "top up" prompt.
- AC3: Joining is allowed any time until the auction ends, including after bidding starts.
- AC4: A farmer can't join their own auction. (UI: show the server's refusal; don't guess client-side.)

## Decisions in force
D-005 @koi/ui; typed client only; keep ClientError.code and never branch on message text; money id-ID via formatPrice.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots/:id | no today → US-040 T-040.1 (must be done first) | { lot: StoreLot } with auction.id, auction.join_fee, auction.status |
| GET | /store/auctions/:id/join | no → T-041.1b (ordered first) | { joined, join_fee } (customer token) |
| POST | /store/auctions/:id/join | no → T-041.1b | 201 { participant, wallet_transaction_id }; 400 insufficient_balance; 403 own_auction; 409 already_joined / auction_not_joinable |
| GET | /store/wallet | yes, src/api/store/wallet/route.ts | { balance, … }, to show the balance beside the fee |

## Build
- src/lib/data/join.ts: getJoinState(auctionId) (null when signed out), joinAuction(auctionId) → { value } | { error, code }.
- Lot page CTA: signed out → "Masuk untuk ikut lelang" (ROUTES.login?redirect=this page);
  not joined → "Ikut lelang · Rp…" + a confirm dialog that shows the fee and the balance;
  joined → "Sudah ikut" badge (the live-room link stays);
  insufficient_balance → the top-up prompt linking ROUTES.topup (copy SubmitAuctionButton's pattern);
  own_auction / auction_not_joinable → show the server message.
- Helper join-failure.ts + .test.ts mapping code → copy (pure).

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/SubmitAuctionButton.tsx (insufficient_balance → top-up prompt)
- apps/storefront-koi/src/lib/helpers/auction-submit.ts + .test.ts (code → message helper)
- apps/storefront-koi/src/components/sections/LotDetailsPage/components/LotPage.tsx:150-215 (CTA block)
- apps/storefront-koi/src/lib/data/cookies.ts:4 getAuthHeaders

## Do not touch
- packages/api/**, apps/admin-koi/**, LivePage/** (US-046), akun/kebun/**

## Definition of done
cd apps/storefront-koi && bun run check                        → pass
render-check skill: /lelang/<live lot> as a seeded customer with enough balance (join → "Sudah ikut"), with a short balance (top-up prompt), signed out (login link), and as sakura.koi.farm@koi.dev on its own lot (refusal shown)
Report: standard header + screenshot paths.

## Open questions
none
```

```text
Story: US-041 (task T-041.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1–AC4. Decisions: D-011, D-032, D-033, D-047, D-048, CLAUDE.md §8 (append-only, SUM, wallet lock).
Code under test: src/modules/auction/models/auction-participant.ts, src/workflows/join-auction.ts, steps/join-fee.ts,
src/api/store/auctions/[id]/join/route.ts, storefront lib/data/join.ts + the lot page CTA.
Commands (alone, one Jest run at a time): cd packages/api && bun run test:integration:modules -- auction-participant;
bun run test:integration:http -- join-auction; cd apps/storefront-koi && bun run check.
Watch for: a double charge under concurrency; a charge without a participant or the reverse; balance read outside
the wallet lock; a ledger row updated or deleted; join allowed on closed/cancelled/draft; the farmer joining their own auction;
identity taken from the body; join refused on a live auction past end_at (D-048 allows it).
Ban part of AC4: not in this story (D-047, delivered and verified by US-059). Don't fail US-041 on it.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```


### US-042 Customer places a bid on the website · `done (evidence: packages/api/integration-tests/http/place-bid.spec.ts:139-291 (10/10, incl. :213-232 concurrent equal bids [201, 400], one row); packages/api/src/workflows/place-bid.ts:25-28 (lock `lot:<id>`); packages/api/src/api/store/bids/route.ts (POST only, no retract); apps/storefront-koi/src/components/sections/LotDetailsPage/components/PlaceBid.tsx:38-67; browser OB prefill, success, refusal; qa PASS; ban clause → US-059, D-047)`
As a **joined customer**, I want to bid on a lot so that I can win it. *(Plan: Bidding, Pricing per lot; D-023)*
- AC1: Only joined customers can bid. Not the farmer, not banned users. *(Ban clause delivered and verified by US-059 T-059.1, D-047; not checked in this story.)*
- AC2: The first bid on a lot may equal OB. Every later bid must be at least current price + KB. A lower bid is rejected with the minimum allowed amount (D-023). "First" means no bid that isn't removed: once every bid is removed, the next may equal OB again (D-036).
- AC3: The lot row is locked and the server's timestamp decides order. Of two equal bids, the first wins and the second is rejected with the new current price.
- AC4: Bids can't be retracted.
- AC5: Each bid saves bidder, amount, source (`web`) and time.
- [x] T-042.1 [backend] `bid` model + place-bid workflow with row lock — built 2026-11-16, qa PASS 2026-11-16 (**uncommitted**: `models/bid.ts`, `Migration20261116050149.ts`, `workflows/place-bid.ts`, `workflows/steps/bid.ts`; lock key `lot:<id>`; `place-bid.spec.ts` 10 specs pass per backend report)
- [x] T-042.2 [backend] Store route `POST` bid, identity from `auth_context` — built 2026-11-16, qa PASS 2026-11-16 (**uncommitted**: `api/store/bids/{route,validators}.ts`, `middlewares.ts` `/store/bids` entry, `routes.d.ts` `store.bids`; rules: first bid = OB, later ≥ current + KB, lot lock, concurrency)
- [x] T-042.3 [storefront] Bid control on the lot page `/lelang/[id]` wired to `POST /store/bids`, with rejection messages keyed on status + code
- [x] T-042.4 [qa] Concurrent equal bids: exactly one accepted
- [x] T-042.5 [qa] First bid = OB accepted; first bid < OB rejected; a later bid < current + KB rejected

**D-055 sweep (2026-11-16):** T-042.1/.2: `own_auction` (`steps/bid.ts:85`), `not_participant` (`:103`), `invalid_amount` (`:144`) are Indonesian in source; `auction_not_live`/`lot_not_open` (`:111,119`) are English but 409 (Medusa rewrites the body, never shown; T-042.3 writes its own copy, `place-bid.ts:118-123`); `bid_too_low` see the follow-up below.
**Scope note (2026-11-16):** bid removal is US-072 (T-072.1 adds `removed_at`/`removed_by` to `bid`), extend is US-043, the ban check is US-059 (D-047). None of them is in US-042. Until US-072 lands, every `bid` row is a live bid, so AC2's "no bid that isn't removed" reduces to "no bid" (`steps/bid.ts` `minimum`).
**Bid gate:** the **auction's** status must be `live` (409 `auction_not_live`); the lot must be `open` (409 `lot_not_open`). A lot is `open` while its auction is still `scheduled` (US-033 note), so the lot status alone isn't the gate.
**Lock limit:** `acquireLockStep` is in-memory without redis, so AC3 holds within one backend process only. Production needs T-090.4.
**Follow-up after acceptance (2026-11-16, not a reopen):** the `bid_too_low` refusal text was English ("Bid at least Rp…") inside the Indonesian UI. `@mercurjs/client` keeps only `message` and `code`, so a numeric `minimum` in the body never reaches the storefront. Fix in progress, per D-055: the **backend message itself** is translated ("Bid minimal Rp1.100.000. Harga sekarang Rp1.000.000.", `src/utils/bid.ts`, uncommitted, not yet qa-verified) and the storefront keeps showing it verbatim (`place-bid.ts:103-108`). Patching or wrapping the client was explicitly rejected by the owner (D-055). AC2/AC3 stay met; the amount and `current_price` are already correct. Still to fix in the same round: the test fixture `apps/storefront-koi/src/lib/helpers/place-bid.test.ts:49-58` still uses the old English text.

#### API contract (from the backend report, 2026-11-16; pinned for T-042.3)

```text
POST /store/bids            auth: customer bearer/session (middlewares.ts), publishable key
Body   { lot_id: string, amount: integer >= 1 }          (Zod: z.number().int().min(1); no customer id in the body)
201    { bid: { id, lot_id, amount, source: "web" | "whatsapp", created_at }, current_price: number }
400    invalid_amount                — not a whole rupiah >= 1
400    bid_too_low                   — message names the minimum, e.g. "Bid at least Rp1.100.000."
401    no customer token
403    own_auction                   — caller is the auction's payer customer (D-033); checked before membership
403    not_participant               — caller hasn't joined (US-041)
404    unknown lot
409    auction_not_live | lot_not_open
       Medusa's error handler rewrites 409 bodies (code and message become generic). Apps key on the
       STATUS, never the body, and re-read the lot (GET /store/lots/:id) to show the current state.
```

#### Briefs

```text
Story: US-042 (task T-042.1)   Release: mvp
Agent: backend   Expected: <=45 min
Status: built 2026-11-16, awaiting qa. Brief recorded after the fact so qa and fix rounds have it.

## Acceptance criteria
- AC2: The first bid on a lot may equal OB. Every later bid must be at least current price + KB. A lower bid is rejected with the minimum allowed amount (D-023). "First" means no bid that isn't removed: once every bid is removed, the next may equal OB again (D-036).
- AC3: The lot row is locked and the server's timestamp decides order. Of two equal bids, the first wins and the second is rejected with the new current price.
- AC4: Bids can't be retracted.
- AC5: Each bid saves bidder, amount, source (`web`) and time.

## Decisions in force
D-023: first bid may equal OB; later >= current + KB.
D-036 / D-024: removal is US-072; leave room (a comment), add no removed fields now.
CLAUDE.md §8: whole-rupiah integers; lock where order matters; save current_price when the bid happens.
CLAUDE.md §9: thin module; soft customer_id (text), no FK into the customer module; one mutation per step with compensation.

## Build
- src/modules/auction/models/bid.ts: id prefix "bid", customer_id text, amount number (check >= 1),
  source enum web | whatsapp (default web), belongsTo lot (Lot.hasMany bids). Index on lot_id.
- Register Bid in AuctionModuleService; export BidDTO. Migration via `medusa db:generate auction`.
- src/workflows/place-bid.ts: acquireLockStep `lot:<lot_id>` → getBiddableLotStep (read-only guards + minimum)
  → createBidStep (compensation: delete) → setLotCurrentPriceStep (compensation: restore previous price)
  → releaseLockStep. No retract route (AC4): only POST exists.
- Leave a `ponytail:` in the guard naming US-059 T-059.1 as where the ban check lands (D-047),
  and a comment naming US-043 as where extend hooks in (after setLotCurrentPriceStep).

## Start from
- packages/api/src/workflows/join-auction.ts (lock + guard + create shape)
- packages/api/src/modules/auction/models/auction-participant.ts (belongsTo + index)
- packages/api/src/modules/auction/models/lot.ts:48-49 (named check constraint)

## Do not touch
- apps/**; src/workflows/{join-auction,decide-auction,create-auction,update-draft-auction}.ts; src/api/store/lots/**

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                         → clean
cd packages/api && bun run test:integration:http -- place-bid      → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + migration file name.

## Open questions
none (mvp-Q6 → D-023)
```

```text
Story: US-042 (task T-042.2)   Release: mvp
Agent: backend   Expected: <=30 min
Status: built 2026-11-16, awaiting qa. Starts after T-042.1.

## Acceptance criteria
- AC1: Only joined customers can bid. Not the farmer, not banned users. *(Ban clause delivered and verified by US-059 T-059.1, D-047; not checked in this story.)*
- AC2, AC3, AC5: as T-042.1 (the route runs that workflow).

## Decisions in force
D-033: auction.payer_customer_id is the farmer's customer id (own-auction check, before membership).
D-047: no ban check. D-048 does not apply (that is join; bidding needs the auction `live`).
CLAUDE.md §9: thin route, Zod in middlewares.ts, identity from req.auth_context only, both generics typed.

## Build
- src/api/store/bids/validators.ts: StorePlaceBid { lot_id: string min 1, amount: int 1..MAX_SAFE_INTEGER }.
- src/api/store/bids/route.ts POST → placeBidWorkflow → 201 { bid, current_price } (contract above).
- middlewares.ts: POST /store/bids → authenticate("customer", ["bearer","session"]) then validateAndTransformBody.
- Guard order in getBiddableLotStep: 404 lot → 403 own_auction → 403 not_participant → 409 auction_not_live
  → 409 lot_not_open → 400 invalid_amount → 400 bid_too_low (message names the minimum in id-ID rupiah).
- bun run codegen.

## Start from
- packages/api/src/api/store/auctions/[id]/join/route.ts (customer identity, error codes)
- packages/api/src/api/middlewares.ts (the /store/auctions/:id/join entry)

## Do not touch
- apps/**; src/api/store/lots/**, src/api/store/auctions/**

## Spec (packages/api/integration-tests/http/place-bid.spec.ts)
first bid = OB → 201 + row saved; first < OB → 400 bid_too_low, no row; next = current + KB → 201, one below → 400;
two concurrent equal bids → [201, 400], one row; not joined → 403 not_participant; payer → 403 own_auction;
auction scheduled/draft/closed/cancelled → 409; cancelled lot → 409; float / 0 → 400; anonymous → 401; unknown lot → 404.

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                         → clean
cd packages/api && bun run codegen                                 → routes.d.ts has store.bids
cd packages/api && bun run test:integration:http -- place-bid      → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

```text
Story: US-042 (task T-042.3)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: US-040 T-040.2b (the lot page on API data) and US-041 T-041.2 (the join CTA on that page).

## Acceptance criteria
- AC1: Only joined customers can bid. Not the farmer, not banned users. (UI: the bid control shows only to a joined customer
  on a `live` auction; every refusal is the server's, never guessed client-side.)
- AC2: The first bid on a lot may equal OB. Every later bid must be at least current price + KB. A lower bid is rejected with the minimum allowed amount (D-023).
  (UI: prefill the minimum — OB when the lot has no bid yet, else current + KB — and show the server's bid_too_low message, which names the minimum.)
- AC3: … Of two equal bids, the first wins and the second is rejected with the new current price.
  (UI: on bid_too_low or any 409, re-read the lot and show the new current price.)
- AC4: Bids can't be retracted. (UI: no cancel/undo control.)

## Decisions in force
D-005 @koi/ui only. Typed client only, never raw fetch. Money via formatPrice (id-ID), integers only.
D-046 / D-050: no bid control on a closed or cancelled lot. D-047: no ban UI.
409 bodies are rewritten by Medusa: branch on err.status === 409, never on its code or message.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /store/lots/:id | yes (T-040.1, committed) | { lot: StoreLot } — current_price, ob, kb, end_time, cancelled, auction.status |
| GET  | /store/auctions/:id/join | yes (T-041.1b, committed) | { joined, join_fee } (customer token) |
| POST | /store/bids | yes (T-042.2, uncommitted until US-042 is accepted) | contract above |
| —    | bid count / "has any bid" for the minimum | **no** | Not needed: use OB when current_price === ob AND no bid is known; otherwise trust the server's bid_too_low. See open question 1. |

## Build
- src/lib/data/bids.ts: placeBid(lotId, amount) → { ok: true, current_price } | { ok: false, status, code?, message }.
  401 → redirect to ROUTES.login?sessionExpired=true&redirect=<lot page> (copy createTopupRequest).
- src/lib/helpers/bid-failure.ts + .test.ts (pure): (status, code, message) → { message, reload: boolean }.
  400 bid_too_low → server message, reload true; 400 invalid_amount → "Masukkan jumlah rupiah bulat.";
  403 own_auction / not_participant → server message; 409 → "Lot ini sedang tidak menerima bid.", reload true.
- Lot page (LotPage.tsx CTA card, ~:140-215): for a joined customer on a `live`, non-cancelled, open lot, replace the
  "Masuk ruang bidding" link with an amount input (prefilled minimum, step = KB) + "Pasang bid" button.
  On 201 show the new current price; on reload, router.refresh() so the page re-reads GET /store/lots/:id.
  Signed out / not joined: keep US-041's CTA. Closed / cancelled / scheduled: no bid control.
- Don't wire BidTerminal in LiveRoom (US-046 owns /live).

## Start from
- apps/storefront-koi/src/lib/data/topups.ts:93-120 (mutate + ClientError + 401 redirect)
- apps/storefront-koi/src/lib/helpers/auction-submit.ts + .test.ts (code → message helper)
- apps/storefront-koi/src/components/sections/LotDetailsPage/components/LotPage.tsx:140-215 (CTA card)
- apps/storefront-koi/src/lib/data/lots.ts (getLot) and lib/data/join.ts (from T-041.2)

## Do not touch
- packages/api/**, apps/admin-koi/**, LivePage/** (US-046), BidHistory (US-044), polling (US-045)

## Definition of done
cd apps/storefront-koi && bun run check                            → pass
render-check skill on /lelang/<live lot id> as a seeded customer who joined: first bid = OB → new price shown;
bid below current + KB → server message with the minimum; as sakura.koi.farm@koi.dev on its own lot → refusal shown;
signed out → no bid control. If chromium can't launch in the container, say so plainly and give curl output.
Report: standard header + screenshot paths.

## Open questions
1. none blocking. The prefill is a convenience; the server is the authority on the minimum. If qa wants an exact
   "first bid" prefill, US-044 T-044.1 adds a bid count to the lot route and this prefill switches to it.
```

```text
Story: US-042 (tasks T-042.4, T-042.5)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent is running Jest. T-042.4/.5 cover the backend; re-run the browser part after T-042.3.

Verify AC1–AC5. Decisions: D-023, D-033, D-036 (scope: removal is US-072), D-047 (ban: not in this story), CLAUDE.md §8.
Code under test: src/modules/auction/models/bid.ts, migrations/Migration20261116050149.ts, src/workflows/place-bid.ts,
src/workflows/steps/bid.ts, src/api/store/bids/{route,validators}.ts, the /store/bids entry in src/api/middlewares.ts;
after T-042.3: storefront lib/data/bids.ts, lib/helpers/bid-failure.ts, LotPage.tsx bid control.
Commands (alone): cd packages/api && bun run test:integration:http -- place-bid; bun x tsc --noEmit -p .;
cd apps/storefront-koi && bun run check.
T-042.4: concurrent equal bids → exactly one 201, one row, current_price = that amount (place-bid.spec.ts "lets only one…").
  Also read the lock key (`lot:<id>`) and confirm the bid read happens after acquireLockStep.
T-042.5: first bid = OB → 201; first < OB → 400 bid_too_low naming OB; next < current + KB → 400 naming current + KB; = current + KB → 201.
AC3 wording check: AC3 says the loser "is rejected with the new current price"; the route's 400 bid_too_low message names
the new MINIMUM (current + KB), and the 201 carries current_price. Judge whether that proves AC3; if not, report it as
FAIL with the exact message, don't pass it silently.
Watch for: identity from the body; a float amount accepted; a bid on a scheduled auction's open lot (must be 409);
a bid on a cancelled lot; a bid row left behind when the price update fails (compensation); any retract/DELETE route (AC4).
Not in scope, don't fail on: ban check (US-059), extend (US-043), masked bidders (US-044), multi-process locking (T-090.4).
Browser (after T-042.3): render-check skill on /lelang/<live lot id>, flows above.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-043 Late bids extend the lot · `done (evidence: packages/api/integration-tests/http/place-bid.spec.ts:342-429 (place-bid 17/17); packages/api/src/workflows/steps/bid.ts:130-136 (AC4 gate, 409 lot_ended), :268-292 (extend, never shortened :277, compensation); packages/api/src/workflows/place-bid.ts:50-55; apps/storefront-koi/src/components/sections/LotDetailsPage/components/LotPage.tsx:86-91,236; PlaceBid.tsx:97; live DB bid end_time − created_at = 5 min; live bid 30 s past end → 409, 0 rows; browser countdown 1m 18s → 4m 57s without reload; storefront check 174 tests; commit dd5f48a; qa PASS)`
As a **bidder**, I want late bids to extend the lot so that nobody wins by sniping.
*(Plan: Extend)*
- AC1: A bid in the last 5 minutes (the setting) moves that lot's end time to 5 minutes after the bid.
- AC2: It repeats until 5 minutes pass with no bid.
- AC3: Each lot extends on its own. Other lots keep their end time.
- AC4: A bid that arrives after the lot's end time is refused (409); the timer has ended, so the lot is no longer open for bids even before the close job runs. *(Plan: Lot lifecycle, "Open for bids --(timer ends)-->"; added 2026-11-16, see below.)*
- [x] T-043.1 [backend] Extend step in the place-bid workflow, plus the bid-after-end gate (AC4) — `steps/bid.ts:130-136,268-292`; `place-bid.spec.ts:342-353,400-429` (incl. compensation restores end_time); place-bid 17/17, backend tsc clean
- [x] T-043.2 [qa] Extend applies per lot and uses the auction's setting at its start; a bid after end_time is refused — `place-bid.spec.ts:377-388` (snapshot 5 used after setting changed to 10), `:389-399` (other lot unchanged, auction.end_at unchanged), `:400-413` (409, nothing written); live 409 check; qa PASS
- [x] T-043.3 [storefront] Lot page shows the extended end time after a bid (re-read, no new route) — `LotPage.tsx:86-91,236`, `PlaceBid.tsx:97`; storefront check 174 tests; browser countdown 1m 18s → 4m 57s, no reload

**Readiness (2026-11-16):** ready once US-042 T-042.1 is accepted (the workflow it hooks into). No open question.
**Brief checked against the built code (2026-11-16):** matches. `getBiddableLotStep` already reads and returns
`end_time` and `auction_id` (`steps/bid.ts:21-32,56,159-160`); the hook point is after `setLotCurrentPriceStep`
(`place-bid.ts:40`) and before `releaseLockStep` (`place-bid.ts:48`); the 201 body is built at `bids/route.ts:53-62`
(type `StorePlaceBidResponse`, `:17-21`), where `end_time` is added. Two corrections, both in the T-043.1 brief:
- **Gap found (AC4):** the guard checks the auction's `live` status and the lot's `open` status (`steps/bid.ts:106-120`)
  but never `end_time`. The close job (US-050) runs once a minute, so a bid could land up to ~60 s after the end and
  the extend step would then push `end_time` forward, reviving a finished lot. The plan's lifecycle ends bidding when
  the timer ends; T-043.1 adds the gate (`now >= end_time` → 409 `lot_ended`). The storefront needs no change: it
  already treats every 409 as "not taking bids" and re-reads the lot (US-042 T-042.3 brief).
- The workflow currently returns `{ bid, lot }` where `lot` is `setLotCurrentPriceStep`'s result, i.e. the
  **pre-extend** row. The response's `end_time` must come from the extend step's output.
- The window is already snapshotted per auction: `auction.extend_window_minutes` (`models/auction.ts:38-40`), set at
  create from the settings table (`create-auction.ts:68`), never changed by a later settings edit (US-030 AC6, US-015 AC2).
  So "the setting" in AC1 means **the auction's stored value**, not the live setting.
- The hook goes in `placeBidWorkflow` (`src/workflows/place-bid.ts`), after `setLotCurrentPriceStep` and before
  `releaseLockStep`, under the same `lot:<id>` lock. `getBiddableLotStep` already returns `end_time` and `auction_id`.
- The server's time decides (CLAUDE.md §8). A bid accepted at time `t` with `end_time - t <= window` sets
  `end_time = t + window`. The end time is never shortened (D-024): only move it when `t + window > end_time`.
- US-050 closes lots on `lot.end_time`; T-030.8 already keeps that column in step with draft edits.

#### Briefs

```text
Story: US-043 (task T-043.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-042 T-042.1/.2 accepted.

## Acceptance criteria
- AC1: A bid in the last 5 minutes (the setting) moves that lot's end time to 5 minutes after the bid.
- AC2: It repeats until 5 minutes pass with no bid.
- AC3: Each lot extends on its own. Other lots keep their end time.
- AC4: A bid that arrives after the lot's end time is refused (409); the timer has ended, so the lot is no longer open for bids even before the close job runs.

## Decisions in force
plan "Extend": window default 5 min, admin-editable; a change applies only to auctions that haven't started → the
  auction's snapshotted extend_window_minutes (US-030 AC6). Each lot extends on its own.
plan "Lot lifecycle": bidding ends when the timer ends (AC4); US-050 closes the lot on the next job tick.
D-024: end time is never shortened (also relevant when US-072 removes a bid later).
CLAUDE.md §8: server timestamp decides; save the new end_time when the bid happens; lock the row.
CLAUDE.md §9: one mutation per step, with compensation; no if/async in the composition (use transform/when).

## Build
- getBiddableLotStep (steps/bid.ts:40): also read auction.extend_window_minutes; return it in BiddableLot (:21-32).
- AC4 gate in getBiddableLotStep, right after the lot_not_open check (:114-120): if Date.now() >= end_time →
  MedusaError CONFLICT, code `lot_ended`, "This lot has ended." (409; Medusa rewrites the body, apps key on status).
  D-055: a 409 message never reaches a user, but write it in Indonesian anyway ("Lot ini sudah selesai.").
  The same instant rule as the close job (US-050 closes `end_time <= now`): a bid is accepted only while now < end_time.
- New step extendLotEndTimeStep (steps/bid.ts): input { lot_id, end_time, window_minutes, bid_at };
  bid_at = the saved bid's created_at (server time, from createBidStep's result).
  If end_time - bid_at <= window → update lot.end_time = bid_at + window, only when that is later than end_time.
  Otherwise no write (return the unchanged end_time). Compensation restores the previous end_time.
- placeBidWorkflow: call it after setLotCurrentPriceStep (place-bid.ts:40), before releaseLockStep (:48).
  Return its end_time (setLotCurrentPriceStep's `lot` is the pre-extend row; don't read end_time from it).
- POST /store/bids response (bids/route.ts:53-62, type :17-21): add `end_time` (ISO) beside current_price, so the
  client shows the new clock. This is an additive change to the contract; run codegen.
- Touch only this lot (AC3): the update filters by lot id; never the auction's end_at.

## Start from
- packages/api/src/workflows/place-bid.ts (the hook point)
- packages/api/src/workflows/steps/bid.ts (getBiddableLotStep, setLotCurrentPriceStep compensation shape :202-228)
- packages/api/src/modules/auction/models/auction.ts:38-40 (extend_window_minutes)
- packages/api/integration-tests/http/farmer-auctions.spec.ts:18-34 (forced-failure test workflow for compensation)

## Do not touch
- apps/**; src/workflows/{create-auction,update-draft-auction,join-auction}.ts; the settings module

## Spec (packages/api/integration-tests/http/place-bid.spec.ts, new describe "extend")
- bid with end_time 3 min away, window 5 → end_time = bid created_at + 5 min (± 1 s)
- bid with end_time 10 min away → end_time unchanged
- two bids in a row inside the window → second pushes it again (AC2)
- auction A has window 5, settings changed to 10 after create → extend uses 5 (snapshot)
- two lots in one auction: bid on lot 1 inside the window → lot 2's end_time unchanged (AC3)
- the auction's end_at unchanged
- forced failure after the extend step → end_time restored (compensation)
- AC4: lot whose end_time is 1 s in the past (auction still `live`, lot still `open`) → 409, no bid row, end_time
  and current_price unchanged

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                         → clean
cd packages/api && bun run codegen                                 → store.bids response has end_time
cd packages/api && bun run test:integration:http -- place-bid      → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + updated POST /store/bids contract.

## Open questions
none
```

```text
Story: US-043 (task T-043.3)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=20 min
Starts after: T-043.1 contract + US-042 T-042.3.

## Acceptance criteria
- AC1: A bid in the last 5 minutes (the setting) moves that lot's end time to 5 minutes after the bid.
  (UI: after a bid, the lot page countdown uses the returned end_time.)

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /store/bids | yes after T-043.1 | 201 { bid, current_price, end_time } |
| GET  | /store/lots/:id | yes | { lot } with end_time |

## Build
- lib/data/bids.ts placeBid: pass end_time through. The lot page's countdown (useCountdown) takes the new end_time
  on success; router.refresh() already re-reads the lot. No new component. Live updates for other viewers are US-045.

## Do not touch
- packages/api/**, LivePage/**, polling (US-045)

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check skill on /lelang/<live lot whose end_time is < 5 min away>: bid → countdown jumps to ~5:00.
Report: standard header + screenshot path, or "browser NOT verified" with the reason.

## Open questions
none
```

```text
Story: US-043 (task T-043.2)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1–AC4. Decisions: plan "Extend", plan "Lot lifecycle" (AC4), US-030 AC6 (snapshot), D-024 (never shortened), CLAUDE.md §8.
AC4: a bid on a `live` auction's `open` lot whose end_time has passed → 409, no row, no extend.
Code under test: src/workflows/place-bid.ts, src/workflows/steps/bid.ts (extend step), src/api/store/bids/route.ts;
storefront lib/data/bids.ts + the lot page countdown.
Commands (alone): cd packages/api && bun run test:integration:http -- place-bid; cd apps/storefront-koi && bun run check.
Watch for: the extend reading the live setting instead of auction.extend_window_minutes; client time used anywhere;
another lot's end_time or the auction's end_at changed; end_time moved earlier; extend computed outside the lot lock;
an extend left in place after a failed bid (compensation).
Browser: render-check on a live lot close to its end, as a joined customer.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-044 Bidders are masked · `todo`
As a **customer**, I want other bidders shown masked so that identities stay private.
*(Plan: Bidding)*
- AC1: Public pages and `/store/*` routes show every bidder as the first 3 letters of their first name + `***` + the
  last 2 characters of their customer id, for example `Bud***x7` (D-051). No phone digits; the full name and the
  customer id never appear in any store response; the same bidder shows the same mask on every row of an auction.
- AC2: A lot's bid history shows masked bidder, amount and time, on open **and** closed lots (D-051). A closed lot
  still returns no winner id, name or `winner_*` field (D-046). A cancelled lot shows no bids (D-050).
- [ ] T-044.1 [backend] The store response returns only the masked name, never raw identity
- [ ] T-044.2 [storefront] `BidHistory` uses API data
- [ ] T-044.3 [qa] No unmasked identity in any store response

**Readiness (2026-11-16): ready (`todo`).** mvp-Q33 answered (D-051): format `Bud***x7`; full masked history on open
and closed lots, which supersedes D-046 in part (the top row of a closed lot shows the winner's masked name; nothing
else about the winner is exposed). Depends on US-042 T-042.1 (the `bid` table, awaiting qa) and US-040 T-040.1
(`GET /store/lots(/:id)`, which this extends).
**US-040 unchanged:** `GET /store/lots` and `/store/lots/:id` today return no bids and no winner field
(`STORE_LOT_FIELDS`, `packages/api/src/api/store/lots/route.ts:56`). Bid history is this story's job; US-040's ACs,
tasks and qa brief stay as written.

#### Briefs

```text
Story: US-044 (task T-044.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-042 T-042.1 accepted (mvp-Q33 answered, D-051).

## Acceptance criteria
- AC1: every bidder shown as first 3 letters of first name + `***` + last 2 characters of the customer id, e.g. `Bud***x7`
  (D-051); no phone digits; full name and customer id never in a store response; same bidder, same mask, per auction.
- AC2: bid history (masked bidder, amount, time) on open and closed lots; closed lot has no winner id/name/`winner_*`
  field (D-046); cancelled lot has no bids (D-050).

## Decisions in force
D-051: the mask format and full masked history on open and closed lots (supersedes D-046 in part).
D-039 / D-042 / D-045: no full PII to anyone else; the bidder's own row may say "Anda" (own record), never another's full name.
D-046 (rest in force): a closed lot returns no winner_customer_id, winner name or any winner_* field.
D-050: a cancelled lot returns no bids.
CLAUDE.md §9: reads via query.graph; no cross-module service call (customer name via a query.graph on customer by id, or a link).

## Build
- GET /store/lots/:id adds `bid_count: number` and `bids: { bidder: string, amount: number, created_at: string }[]`
  (newest first, cap 50). GET /store/lots adds `bid_count` only (the card tally).
- `bidder` is built server-side by one helper `maskBidder(firstName, customerId)` in src/utils/mask.ts (D-051):
  - name part = first 3 characters of the trimmed `customer.first_name` (the field `isProfileComplete` requires,
    src/workflows/create-customer-wallet.ts:27). Shorter than 3 → keep what there is, no padding (`Al` → `Al***x7`).
    Missing or blank → name part empty (`***x7`).
  - id part = last 2 characters of `bid.customer_id` (Medusa customer id, `cus_` + ULID, e.g.
    `cus_01M6V7FMYJDQ3DC4J4ZYQ5S09X` → `9x`), lowercased to match the owner's example. Stable per customer, not
    derived from PII, never guessable back to the full id.
  - The mask is a pure function of (first_name, customer_id): no randomness, no per-request salt, so one bidder
    masks the same way on every row and every request in an auction.
  - Never return customer_id, winner_customer_id, email, phone or the full name; the id itself stays on the server.
- Same mask on open AND closed lots. Closed lot → full history (top row = winner's masked name, D-051), and still
  no winner_customer_id or any winner_* field (D-046).
- Cancelled lot → bids: [], bid_count: 0 (D-050).
- Exclude removed bids once US-072 T-072.1 adds removal; leave a comment naming T-072.1 at the bids query.
- bun run codegen.

## Start from
- packages/api/src/api/store/lots/route.ts (STORE_LOT_FIELDS, getPublicLots, the cancelled-lot nulling at :72)
- packages/api/src/utils/mask.ts (helpers + style)

## Do not touch
- apps/**; src/workflows/place-bid.ts; src/api/store/bids/**

## Spec (store-lots.spec.ts)
two customers bid → bids[].bidder matches /^.{0,3}\*\*\*[0-9a-z]{2}$/ and equals maskBidder(first_name, id);
same customer → same string on every row; no customer_id/winner_customer_id/email/phone/full name anywhere in the JSON
(stringify + regex on the customer ids and names); bid_count correct; cancelled lot → []; closed lot → full history,
same masks, no winner_* key. Unit check for maskBidder: "Budi" → "Bud***", "Al" → "Al***", blank → "***" (+ id part).

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen; bun run test:integration:http -- store-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + updated GET /store/lots(/:id) contract.

## Open questions
none (mvp-Q33 answered, D-051)
```

```text
Story: US-044 (task T-044.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=30 min
Starts after: T-044.1 contract.

## Acceptance criteria
- AC1: every bidder shown masked as the API sends it, e.g. `Bud***x7` (D-051).
- AC2: bid history (masked bidder, amount, time) on open and closed lots; none on a cancelled lot (D-050).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots/:id | yes; bids/bid_count added by T-044.1 | { lot: { …, bid_count, bids: [{ bidder, amount, created_at }] } } |
| GET | /store/lots | yes; bid_count added by T-044.1 | card tally |

## Build
- lib/adapters/lot.ts: map bid_count → auction.bidCount, bids → auction.bids (AuctionBid: bidder, amount, at).
  Remove the "US-044 owns bid counts" placeholder. Extend lot.test.ts.
- Lot page: render BidHistory (components/molecules/BidHistory) from lot.auction.bids. Show `bidder` as the API sends it;
  never mask or unmask client-side. Empty → the component's own empty state. Closed → full history, no "Pemenang"
  label or winner highlight on the top row (D-046 rest). Cancelled → no history.
- Don't touch LiveRoom's demo `bidsFor` (US-046).

## Do not touch
- packages/api/**, LivePage/**, const/live.ts

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check skill on /lelang/<lot with bids>: history shows masked names, Rupiah amounts, times; no "undefined".
Report: standard header + screenshot path, or "browser NOT verified" with the reason.

## Open questions
none (mvp-Q33 answered, D-051)
```

```text
Story: US-044 (task T-044.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1–AC2. Decisions: D-051, D-039, D-042, D-045, D-046 (in part), D-050.
Code under test: src/utils/mask.ts (bidder helper), src/api/store/lots/{route,[id]/route}.ts; storefront lib/adapters/lot.ts, lot page.
Commands (alone): cd packages/api && bun run test:integration:http -- store-lots; cd apps/storefront-koi && bun run check.
Check every /store/* response that carries a bid (GET /store/lots, /store/lots/:id, POST /store/bids) for customer_id,
email, phone, first/last name — none may appear for another customer. POST /store/bids returns only the caller's own bid.
Watch for: a mask other than `Bud***x7` (D-051), phone digits in it, one bidder masked two ways in an auction; on a
closed lot any winner_customer_id / winner_* field or "winner" label (the masked top row itself is allowed, D-051);
a closed lot whose history differs from an open lot's format; bids shown on a cancelled lot (D-050).
Browser: render-check on /lelang and /lelang/<lot with bids>.
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-045 Prices update live · `todo`
As a **bidder**, I want the price and countdown to update without reloading so
that I see outbids quickly. *(Plan: Key flows: live updates)*
- AC1: The lot page polls every few seconds. No websockets or SSE in the MVP.
- [ ] T-045.1 [storefront] Polling on the lot page and live room
- [ ] T-045.2 [qa] An outbid appears within one polling interval

### US-046 Live bidding room · `todo`
As a **bidder**, I want a live screen with one lot at a time so that the auction
feels like a live event. *(Plan: Live room)*
- AC1: Shows one lot at a time: photo, current price, countdown, bid feed.
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built.
- [ ] T-046.1 [backend] Live link field on the auction
- [ ] T-046.2 [storefront] `live` page on real data, replacing `const/live.ts`
- [ ] T-046.3 [storefront] Farmer area: set the live link

---

## Epic 5: Closing and after-sale (Milestone 5)

### US-050 Lots close automatically · `done (evidence: packages/api/integration-tests/http/close-lots-job.spec.ts:93-280 (12/12); packages/api/src/jobs/close-lots.ts:42-43,49-60,84 (every minute, open AND end_time <= now, per-id try/catch, one summary log); packages/api/src/workflows/steps/lot.ts:59-95 (guard open + auction live; winner amount DESC, created_at ASC); packages/api/src/workflows/close-lot.ts:18 (lock lot:<id>, same as place-bid); packages/api/src/workflows/close-auction.ts:27-36; Migration20261116164737 (closed_at); live tick "lots found 1, won 0, unsold 1, skipped 0, failed 0; auctions closed 1"; browser closed lot shows final price / "Tidak terjual", no winner (D-046); commit dd5f48a; qa PASS. Not verified: two concurrent ticks, one bad row in a real batch (code-read only))`
As the **platform**, I want lots closed when their time ends so that winners are
fixed. *(Plan: Closing and winners, Key flows)*
- AC1: A job every minute closes lots past their end time.
- AC2: Highest bid that isn't removed wins (`won`). No such bid gives `unsold`. A `cancelled` lot is never closed (D-035).
- AC3: Winner, final price and close time are saved on the lot, never recomputed from bids.
- [x] T-050.1 [backend] Close-lot workflow + `closed_at` column (lock, guard, winner and price saved) — `close-lot.ts:18`, `steps/lot.ts:59-95`; Migration20261116164737 applied; `close-lots-job.spec.ts:93-196` (won, tie to earliest, unsold, cancelled/scheduled untouched, forced failure restores lot); close-lots-job 12/12
- [x] T-050.2 [backend] Close-auction workflow + the `close-lots` job running both (idempotent, batched): the auction becomes `closed` when all its lots are closed (`unsold`, `won` or later, or `cancelled`) — `close-auction.ts:27-36`, `jobs/close-lots.ts:11-30` (paged ids), `:84`; `close-lots-job.spec.ts:197-237,268-280`; live tick logged one summary line
- [x] T-050.3 [qa] Running the job twice changes nothing; an extended lot isn't closed early — `close-lots-job.spec.ts:137-146,210-228,238-267` (second run leaves updated_at and closed_at identical); qa PASS

**Readiness (2026-11-16): ready (`todo`).** No open question blocks it. Starts after US-042 is accepted and committed
(the `bid` table and `lot.bids` relation are uncommitted today, and T-050.1 adds a lot migration on top of them) and
after US-043 T-043.1 (bids refused after `end_time`, so close and bid agree on the instant).
- **When the auction closes:** stated by D-048 ("the auction is still `live` until every lot has closed (US-050)") and
  the plan's auction enum `live → closed` (plan "Design rules"). A `cancelled` lot counts as closed (D-035: no winner,
  never reopened). So: a `live` auction with no `open` lot left → `closed`. No `end_at` check is needed.
- **Close time:** the plan says "Winner, final price and close time are saved on the lot" (Closing and winners), but
  `lot` has no close-time column (`models/lot.ts:23-37`). T-050.1 adds `closed_at` (nullable). US-051's 1×24 h
  deadline is computed from it.
- **Winner:** the highest bid; of two equal amounts the first recorded (plan "Bidding"). Removal is US-072, so every
  bid counts today (same note as `steps/bid.ts` `minimum`). Saved once, never recomputed (CLAUDE.md §8, D-036).
- **Cancelled lots are skipped** (D-035, D-050): the guard closes only `open` lots. Lots of a `cancelled` auction are
  skipped because the guard also requires the auction to be `live`.
- **Extended lots:** the job reads `lot.end_time`, which US-043 moves; T-030.8 keeps it in step with draft edits.
- No frontend task: US-040 already renders a closed lot's final price and sold/unsold (`store/lots/route.ts:80,113-118`),
  and US-033's tracker already shows `closed`.

#### Briefs

```text
Story: US-050 (task T-050.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-042 accepted and committed; US-043 T-043.1 accepted.

## Acceptance criteria
- AC2: Highest bid that isn't removed wins (`won`). No such bid gives `unsold`. A `cancelled` lot is never closed (D-035).
- AC3: Winner, final price and close time are saved on the lot, never recomputed from bids.

## Decisions in force
plan "Closing and winners": highest bid wins; no bids → unsold; winner, final price and close time saved on the lot.
plan "Bidding": of two equal bids, the first recorded wins.
D-035: a cancelled lot has no winner and is never closed. D-036: results saved at close, never recomputed.
CLAUDE.md §8: lock the row; save results when the action happens; explicit enum transitions (`open → won | unsold`).
CLAUDE.md §9: one mutation per step with compensation; no if/async in the composition (use when/transform).

## Build
- Lot model: add `closed_at: model.dateTime().nullable()`; generate the migration (`bunx medusa db:generate auction`).
- New file src/workflows/steps/lot.ts:
  - `setLotFieldsStep` — single mutation `{ id, update }`, compensation restores exactly the changed fields
    (copy setAuctionFieldsStep, steps/auction.ts:378-406). US-052/053 reuse it.
  - `getClosableLotStep` (read only) — lot + auction.status + its bids; returns `{ close: boolean, update }`:
    close only when lot.status === "open" AND auction.status === "live" AND end_time <= now (server clock).
    Winner = bid with max amount, tie → earliest created_at. update = { status: "won", winner_customer_id,
    final_price: winning amount, closed_at: now } or { status: "unsold", closed_at: now } (winner/final stay null).
- New workflow src/workflows/close-lot.ts `closeLotWorkflow({ lot_id })`: acquireLockStep `lot:<id>` (the SAME key as
  place-bid.ts:25-28, so a bid and the close can't interleave) → getClosableLotStep → when(close) setLotFieldsStep →
  releaseLockStep. Returns { closed, status }. Not due / already closed → skipped, never an error.
- Comment at the bids read naming US-072 T-072.1 (exclude removed bids once removal exists).

## Start from
- packages/api/src/workflows/start-auction.ts (lock + read guard + when, the same shape)
- packages/api/src/workflows/steps/auction.ts:378-406 (setAuctionFieldsStep)
- packages/api/src/modules/auction/models/lot.ts

## Do not touch
- apps/**; src/workflows/place-bid.ts, steps/bid.ts; src/api/store/lots/** (US-040 already renders closed lots)

## Spec (packages/api/integration-tests/http/close-lots-job.spec.ts; seed via the module service like auction-start-job.spec.ts:16-46)
- live auction, lot end_time past, bids 1.0M (A) and 1.1M (B) → won, winner B, final_price 1_100_000, closed_at set
- no bids → unsold, winner_customer_id and final_price null, closed_at set
- end_time in the future (an extended lot) → still open
- cancelled lot with past end_time → untouched; lot of a `scheduled` / `cancelled` auction → untouched
- second run on a closed lot → closed: false, updated_at identical
- forced failure after setLotFieldsStep (test workflow, farmer-auctions.spec.ts:18-34) → lot back to open, fields null

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                              → clean
cd packages/api && bun run test:integration:http -- close-lots-job      → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + migration name + the workflow's input/output.

## Open questions
none
```

```text
Story: US-050 (task T-050.2)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: T-050.1.

## Acceptance criteria
- AC1: A job every minute closes lots past their end time.
- T-050.2: The auction becomes `closed` when all its lots are closed (`unsold`, `won` or later, or `cancelled`).

## Decisions in force
D-048: the auction stays `live` until every lot has closed. Plan enum: auction `live → closed`.
D-035: cancelled lots count as closed. CLAUDE.md §9: job fetches ids, runs a workflow, idempotent, batched.

## Build
- New workflow src/workflows/close-auction.ts `closeAuctionWorkflow({ auction_id })`: lock `auction:<id>` (same key as
  start-auction.ts:31 and approve/reject) → read guard: status === "live" AND no lot with status "open" →
  when(due) setAuctionFieldsStep({ status: "closed" }) → release. Returns { closed }.
- New job src/jobs/close-lots.ts, schedule "* * * * *", copy start-auctions.ts:
  1. ids of lots with status "open" AND end_time <= now (pages of 50, ids first, then process) → closeLotWorkflow each.
  2. ids of `live` auctions → closeAuctionWorkflow each (the workflow's guard decides; skipped is not an error).
  Per-id try/catch; one summary log line: lots found/won/unsold/skipped/failed, auctions closed.

## Start from
- packages/api/src/jobs/start-auctions.ts (paging, per-id try/catch, summary)
- packages/api/src/workflows/start-auction.ts (lock + guard + setAuctionFieldsStep)

## Do not touch
- apps/**; src/jobs/start-auctions.ts; src/workflows/place-bid.ts

## Spec (close-lots-job.spec.ts, new describe "job")
- live auction, 2 lots past end_time → both closed, auction `closed`
- 2 lots, one past end, one extended into the future → first closed, auction stays `live`; later run after the second
  ends → auction `closed`
- live auction whose only open lot is cancelled → `closed` (all lots closed)
- second job run → nothing changes (updated_at identical on lots and auction)
- `scheduled`, `closed`, `cancelled` auctions → untouched

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                              → clean
cd packages/api && bun run test:integration:http -- close-lots-job      → pass (alone)
Real tick in the dev DB (optional, as in T-033.1): log line "close-lots: ..." seen. Say if not run.
Report: standard header + job name/schedule + the summary log format.

## Open questions
none
```

```text
Story: US-050 (task T-050.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1–AC3 and T-050.2. Decisions: D-035, D-036, D-048, plan "Closing and winners", CLAUDE.md §8.
Code under test: src/jobs/close-lots.ts, src/workflows/{close-lot,close-auction}.ts, src/workflows/steps/lot.ts,
the lot migration.
Commands (alone): cd packages/api && bun run test:integration:http -- close-lots-job; then -- place-bid (regression).
Watch for: winner taken from current_price or the last bid instead of the highest bid; equal-amount tie not won by the
first recorded; a cancelled lot touched; the auction closed while a lot is still open (extended); final_price/winner
rewritten on a second run; close without the `lot:<id>` lock; a store response now exposing winner_customer_id (D-046).
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-051 Farmer sees the winner's name and address; winner sees their won lots · `todo` (winner bank-account part `parked (owner reconsidering, 2026-11-16)`)
**Depends on:** US-092 (masking and the logged reveal).
As a **farmer**, I want the winner's name and delivery address so that I can ship the fish; as a **winner**, I want
my won lots listed so that I can see what I won and mark it delivered. *(Plan: Closing and winners, Delivery; D-044
(on hold), D-052, D-056, D-057)*
- AC1 *(parked, owner reconsidering, 2026-11-16; D-044 on hold)*: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044) and nothing else, plus the 1×24 h deadline. No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC2: The farmer sees, for their own sold lots, the winner's name and the winner's default shipping address masked: `city` and `province` only; street lines and postal code are not sent (D-056). No winner phone, masked or full (D-052). *(Changed 2026-11-16, `mvp-Q37`: was "name only, no reveal".)*
- AC3 *(parked with AC1; rule recorded by D-057, `mvp-Q39`)*: The farmer's bank account is shown masked; the winner reveals the full account number **and** full account-holder name for their own winning lot only, in one logged reveal (`field: "bank_account"`, one audit row) (D-044, D-057). Until the reveal, the winner sees a mask.
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-056).
- AC5: The farmer reveals the winner's full default shipping address for their own sold lot only, through the logged reveal: one `pii_reveal_audit` row per reveal, `record_type: "lot"`, `record_id: <lot id>`, `field: "shipping_address"`. If the winner has no default shipping address, the row shows "Alamat belum diisi" with no reveal button, and a reveal call gets 404 with no audit row (D-056).
- AC6: The winner sees their own won lots with no farmer contact (no bank account, no holder name, no phone). A winner with no default shipping address sees a prompt on the won lot to add one, linking to `/akun/alamat` (D-056).
**PII (D-039, D-052, D-056):** the winner's full address is a narrow exception for the farmer of that lot, through the same logged reveal as the admin. No phone crosses between winner and farmer (D-052). The winner sees no farmer contact while D-044 is on hold.
- [ ] T-051.1a [backend] `GET /store/won-lots`: the winner's own won lots, farm name, bank name, masked account number and holder name, 1×24 h deadline; no phone (D-052) *(parked (owner reconsidering, 2026-11-16): carries farmer bank details; replaced for now by T-051.6)*
- [ ] T-051.3a [backend] `POST /store/won-lots/:id/reveal`: winner reveals the farmer's bank account number and holder name for their own lot, one audit row (D-057) *(parked (owner reconsidering, 2026-11-16))*
- [ ] T-051.1b [backend] `GET /vendor/sold-lots`: the farmer's own sold lots with the winner's name and masked default shipping address (city + province, D-056); no phone (D-052)
- T-051.3b *(dropped 2026-11-16, D-052: the farmer no longer reveals the winner's phone. Not built.)*
- [ ] T-051.5 [backend] `POST /vendor/sold-lots/:id/reveal`: the farmer reveals the winner's full default shipping address for their own sold lot; one audit row per reveal (D-056) *(new 2026-11-16)*
- [ ] T-051.6 [backend] `GET /store/won-lots` without farmer contact: the winner's own won lots plus `has_shipping_address` (D-056) *(new 2026-11-16; the no-contact version of T-051.1a)*
- [ ] T-051.2a [storefront] Won lots page `/akun/menang` with the bank-account reveal *(parked (owner reconsidering, 2026-11-16); replaced for now by T-051.7)*
- [ ] T-051.7 [storefront] Won lots page `/akun/menang` with no farmer contact and the "add an address" prompt (D-056) *(new 2026-11-16; US-053 T-053.2 sits on it)*
- [ ] T-051.2b [storefront] Sold lots page in the Farmer area (winner's name, masked address, address reveal)
- [ ] T-051.4 [qa] Other users get 404 or no data; the full address is reachable only for the farmer's own sold lot and every reveal is audited; no farmer contact in any won-lot response or page; no phone in any won-lot or sold-lot response or page

**Under escrow** (owner's planned direction, 2026-11-16, not a decision): the winner pays the platform through Xendit,
so the winner never needs the farmer's bank account; AC1, AC3, T-051.1a, T-051.3a and T-051.2a would be dropped.

**Readiness (2026-11-16): `todo` for the farmer side and the no-contact winner page; winner bank-account part
`parked (owner reconsidering, 2026-11-16)`.** `mvp-Q37` answered by D-056 (farmer gets the winner's default shipping
address, masked, full through a logged reveal). `mvp-Q39` answered by D-057 (number + holder name, one row), but it
applies only if D-044 returns. Owner, same day: "for now don't show farmer contact" → D-044 on hold, winner bank tasks
parked (not blocked by a question; the owner is recalculating the payment model).
Build order: T-051.1b → T-051.5 → T-051.2b (farmer), T-051.6 → T-051.7 (winner), then T-051.4.
**Depends on:** US-050 (winner_customer_id, final_price, `closed_at`).
**Reuse, no second audit mechanism:** `createPiiRevealAuditStep` (`src/workflows/steps/pii-reveal.ts:66`, already
generic: its comment names US-051) writes to `pii_reveal_audit` (`src/modules/pii-audit/models/pii-reveal-audit.ts`,
open-text `actor_type`/`record_type`). Lot reveals use `record_type: "lot"`, `record_id: <lot id>` (AC4 "which lot").
Pattern: `revealFarmPiiWorkflow` (`src/workflows/reveal-farm-pii.ts:16-33`): read, then audit row, value returned
only after the row is written.
**Address (D-056), verified in Medusa 2.21.2 `@medusajs/customer` `models/address.js`:** `customer_address` has
`first_name, last_name, company, address_1, address_2, city, province, postal_code, country_code, phone,
is_default_shipping, is_default_billing`, and `customer.addresses` is a hasMany. At most one default shipping address
per customer (unique partial index `IDX_customer_address_unique_customer_shipping`). The default = the address with
`is_default_shipping = true`; none → "no address" (don't fall back to the first address). Never select the address's
`phone` (D-052) or `company`. Read at reveal time; nothing copied onto the lot. The storefront already writes
`is_default_shipping` (`lib/data/customer.ts:195`) and has the address page (`ROUTES.addresses` = `/akun/alamat`).
**Masking:** routes mask themselves; for the address that means not selecting the hidden fields at all (D-056: the
`mask.ts` helpers keep leading/trailing characters, which on a street line leaks the house number, so none is used).
The response middlewares are a second net only: `storePiiMask` masks only `seller`/`sellers` keys and `vendorPiiMask`
masks `phone`/`payment_details`/`ktp_nik` keys (`src/api/utils/mask-response.ts:69-130,155-157`). A reveal response is
`{ field, value }`. No route here selects `phone` at all (D-052): not masking a phone is not enough, it must not be read.
**Names:** the farmer sees the winner's name (plan "Closing and winners"). Names stay unmasked, as in the admin farm
queue (`admin/farms/route.ts:160,218`); only account-holder names are masked (`maskName`).

#### Briefs

```text
Story: US-051 (task T-051.1b)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: US-050 T-050.1 (closed_at, winner saved).

## Acceptance criteria
- AC2: The farmer sees, for their own sold lots, the winner's name and the winner's default shipping address masked: `city` and `province` only; street lines and postal code are not sent (D-056). No winner phone, masked or full (D-052).

## Decisions in force
D-052: no phone between winner and farmer: the row never selects or returns the winner's phone (customer.phone or the
address's phone), masked or not. D-056: address = the winner's address with is_default_shipping = true; the row carries
only city + province; address_1, address_2, postal_code, company, phone are never selected.
D-039 / D-042: no other winner PII (email, customer id). D-003: member token + x-seller-id; seller from
req.seller_context, never the body. D-055: any message a Koi app may show verbatim is Indonesian.
CLAUDE.md §9: reads via query.graph; route thin; both generics typed.

## Build
- GET /vendor/sold-lots (src/api/vendor/sold-lots/route.ts): lots whose auction.seller_id = req.seller_context.seller_id
  and status in won | paid | shipped | delivered | claimed (the SOLD_STATUSES list, store/lots/route.ts:80).
  Newest closed first; limit/offset (Zod, max 100).
- Row: { id, status, final_price, closed_at, auction: { id, delivery_method }, product: { title, thumbnail },
  winner: { name: first_name + " " + last_name, address: { city, province } | null } }. Winner read by one query.graph
  on `customer` (fields id, first_name, last_name, addresses.is_default_shipping, addresses.city, addresses.province
  only) filtered by the lots' winner_customer_id (one query for the page, not one per row); pick the address with
  is_default_shipping = true in the mapper (filtering a nested relation in query.graph is not verified); none → null.
- Never return winner_customer_id, email, any phone, or any other address field.
- Import "../../../types/seller-context" (submit/route.ts:11 pattern). bun run codegen.

## Start from
- packages/api/src/api/vendor/auctions/[id]/route.ts:30-56 (seller-scoped read)
- packages/api/src/api/vendor/auctions/route.ts + validators.ts (list params pattern)

## Do not touch
- apps/**; src/api/utils/mask-response.ts; src/api/store/**; src/modules/pii-audit/**

## Spec (packages/api/integration-tests/http/sold-lots.spec.ts; real seller + member token like farmer-auctions.spec.ts)
- farmer A sees their won lot with the winner's full name and address { city, province } of the default shipping address
- winner with a non-default address only → address null; winner with none → address null
- farmer B (other seller) → lot not in the list; open/unsold/cancelled lots not listed
- JSON has no winner_customer_id, no email, no `phone` key and not the winner's phone digits (stringify + includes);
  not the address_1 or postal_code strings (stringify + includes)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- sold-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

T-051.3b has no brief: dropped by D-052 (the farmer no longer reveals the winner's phone).

```text
Story: US-051 (task T-051.5)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: T-051.1b (route folder, ownership read).

## Acceptance criteria
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-056).
- AC5: The farmer reveals the winner's full default shipping address for their own sold lot only, through the logged reveal: one `pii_reveal_audit` row per reveal, `record_type: "lot"`, `record_id: <lot id>`, `field: "shipping_address"`. If the winner has no default shipping address, ... a reveal call gets 404 with no audit row (D-056).

## Decisions in force
D-056: the full address only through this reveal; one reveal returns the whole address and writes one row.
D-042: explicit, append-only audit row, value returned only after the row is written. D-052: never select the
customer's or the address's phone; `company` not selected either. D-003: seller from req.seller_context; actor_type and
actor_id from req.auth_context, never the body. D-055: messages a Koi app may show verbatim are Indonesian.

## Build
- POST /vendor/sold-lots/:id/reveal, body { field: "shipping_address" } (Zod enum, one value; middlewares.ts
  validateAndTransformBody like /admin/farms/:id/reveal at :460-465).
- Workflow src/workflows/reveal-lot-address.ts `revealWinnerAddressWorkflow({ seller_id, lot_id, field, actor_type,
  actor_id })`: read step (lot with auction.seller_id = seller_id and status in the SOLD_STATUSES list, else 404 with no
  existence leak; then the winner's address with is_default_shipping = true via query.graph on `customer`, fields
  addresses.{is_default_shipping, first_name, last_name, address_1, address_2, postal_code, city, province,
  country_code}; none → 404 NOT_FOUND, Indonesian message "Alamat pemenang belum diisi") → createPiiRevealAuditStep({
  actor_type, actor_id, record_type: "lot", record_id: lot_id, field: "shipping_address" }) → return { field, value:
  { first_name, last_name, address_1, address_2, postal_code, city, province, country_code } }.
- No new audit model. Import "../../../../../types/seller-context". bun run codegen.

## Start from
- packages/api/src/workflows/reveal-farm-pii.ts:16-33; src/workflows/steps/pii-reveal.ts:54-74
- packages/api/src/api/admin/farms/[id]/reveal/route.ts (route shape, actor from auth_context :20)
- packages/api/src/api/vendor/sold-lots/route.ts (T-051.1b: ownership + SOLD_STATUSES)

## Do not touch
- apps/**; src/modules/pii-audit/**; src/api/utils/mask-response.ts; src/api/store/**

## Spec (sold-lots.spec.ts, describe "address reveal")
- own sold lot, winner has a default shipping address → 200 { field: "shipping_address", value: full address };
  exactly one new pii_reveal_audit row (actor_id, record_type "lot", record_id, field "shipping_address")
- winner with no default shipping address → 404, no audit row
- another seller's lot → 404, no audit row; open/unsold/cancelled lot → 404, no audit row
- field "phone" → 400; response has no `phone` key and not the address's phone digits

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- sold-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

```text
Story: US-051 (task T-051.2b)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=40 min
Starts after: T-051.1b and T-051.5 contracts.

## Acceptance criteria
- AC2: The farmer sees, for their own sold lots, the winner's name and the winner's default shipping address masked: `city` and `province` only; street lines and postal code are not sent (D-056). No winner phone, masked or full (D-052).
- AC5: The farmer reveals the winner's full default shipping address for their own sold lot only, through the logged reveal. If the winner has no default shipping address, the row shows "Alamat belum diisi" with no reveal button (D-056).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /vendor/sold-lots | after T-051.1b | { lots: [{ id, status, final_price, closed_at, auction, product, winner: { name, address: { city, province } \| null } }], count } |
| POST | /vendor/sold-lots/:id/reveal | after T-051.5 | { field: "shipping_address" } → 200 { field, value: { first_name, last_name, address_1, address_2, postal_code, city, province, country_code } }; 404 |

## Build
- Route /akun/kebun/terjual (ROUTES.farmSold in const/routes.ts); farmer guard as FarmHomePage.tsx:61-85.
- Data: lib/data/auctions.ts beside getMyAuctions, using vendorHeaders() (:85-90); typed sdk only, no raw fetch.
- Table: product, final price (id-ID Rupiah), closed date, status label, winner name, address: "city, province" +
  "Tampilkan alamat" button; address null → "Alamat belum diisi", no button. The reveal fetches on click only (never on
  render: each reveal writes an audit row), then shows the full address. Copy the behaviour of admin-koi
  FarmQueue.tsx:257-313; don't import from admin-koi. No phone column, no WhatsApp/wa.me link (D-052).
- Link to it from the Farmer area home (FarmHomePage).

## Do not touch
- packages/api/**, apps/admin-koi/**, the won-lots page (T-051.2a), LivePage/**

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check skill on /akun/kebun/terjual as sakura.koi.farm@koi.dev. Data: needs a lot won from that farm's auction;
create it through the API flow if none exists, else say "browser NOT verified" and why.
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
PARKED (owner reconsidering, 2026-11-16; D-044 on hold). Don't hand off. Kept for if D-044 returns; T-051.6 replaces it now.
Story: US-051 (task T-051.1a)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: US-050 T-050.1 (winner_customer_id, final_price, closed_at).

## Acceptance criteria
- AC1: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044) and nothing else, plus the 1×24 h deadline. No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC3: The farmer's bank account is shown masked; the winner reveals the full account number for their own winning lot only, through the logged reveal (D-044). Until the reveal, the winner sees a mask.

## Decisions in force
D-052: never select or return the farm's phone (seller.phone), masked or not. D-044: account masked here; full only via
T-051.3a. D-046: this is the caller's own data, not a public route; store/lots/** stays winner-free.
D-055: messages a Koi app may show verbatim are Indonesian. Identity from req.auth_context.actor_id only.

## Build
- GET /store/won-lots (src/api/store/won-lots/route.ts): lots with winner_customer_id = auth_context.actor_id and status
  in the SOLD_STATUSES list (store/lots/route.ts:80). Newest closed first; limit/offset (Zod, max 100).
- middlewares.ts entry authenticate("customer", ["bearer","session"]) as /store/bids (:281-288).
- Row: { id, status, final_price, closed_at, pay_by: closed_at + 24 h (ISO), product: { title, thumbnail },
  auction: { id, delivery_method }, seller: { id, name, payment_details: { bank_name, holder_name: maskName(...),
  account_number: maskAccountNumber(...) } } }. Seller read by one query.graph on `seller` for the page's
  auction.seller_id values, fields id, name, payment_details.{bank_name,holder_name,account_number}
  (admin/farms/route.ts:80-82); never `phone`. Key `seller` so storePiiMask re-masks as a second net (idempotent).
- bun run codegen.

## Start from
- packages/api/src/api/store/bids/route.ts (customer route, auth_context)
- packages/api/src/api/admin/farms/route.ts:66-82,208-213 (seller payment_details fields + masking)
- packages/api/src/utils/mask.ts:21-31

## Do not touch
- apps/**; src/api/store/lots/**; src/api/vendor/**; src/modules/pii-audit/**; src/api/utils/mask-response.ts

## Spec (packages/api/integration-tests/http/won-lots.spec.ts)
- winner sees own won lot: masked account (last 4 only), masked holder name, bank name, pay_by = closed_at + 24 h
- another customer → the lot not listed; open/unsold/cancelled lots not listed; anonymous → 401
- JSON has no `phone` key and not the farm's phone digits; no full account number

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- won-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none (mvp-Q39 answered by D-057: holder name masked here, full only through T-051.3a)
```

```text
PARKED (owner reconsidering, 2026-11-16; D-044 and D-057 on hold). Don't hand off. Updated for D-057 so it is ready if D-044 returns.
Story: US-051 (task T-051.3a)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: T-051.1a.

## Acceptance criteria
- AC3: … the winner reveals the full account number **and** full account-holder name for their own winning lot only, in one logged reveal (`field: "bank_account"`, one audit row) (D-044, D-057).
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-056).

## Decisions in force
D-044: full bank account, winner's own lot only, logged reveal. D-057: one reveal returns number + holder name, one
audit row with field "bank_account". D-042: explicit, append-only audit row. D-052: no phone field in the enum. D-055: messages a Koi app may show verbatim are Indonesian.

## Build
- POST /store/won-lots/:id/reveal, body { field: "bank_account" } (Zod enum, one value (D-057); middlewares.ts
  authenticate("customer", …) + validateAndTransformBody, like /admin/farms/:id/reveal at :460-465).
- Workflow src/workflows/reveal-lot-contact.ts `revealFarmBankAccountWorkflow({ customer_id, lot_id, field, actor_id })`:
  read step (lot with winner_customer_id = customer_id and status in the sold list, else 404 with no existence leak;
  then seller.payment_details.{account_number, holder_name} via auction.seller_id) → createPiiRevealAuditStep({
  actor_type: "customer", actor_id, record_type: "lot", record_id: lot_id, field: "bank_account" }) → return
  { field, value: { account_number, holder_name } }.
- actor_id from req.auth_context, never the body. bun run codegen.

## Start from
- packages/api/src/workflows/reveal-farm-pii.ts:16-33; src/workflows/steps/pii-reveal.ts:54-74
- packages/api/src/api/admin/farms/[id]/reveal/route.ts (route shape)

## Do not touch
- apps/**; src/modules/pii-audit/** (no new model, no second audit table); src/api/utils/mask-response.ts; src/api/vendor/**

## Spec (won-lots.spec.ts, describe "reveal")
- own won lot → 200 { field: "bank_account", value: { account_number, holder_name } (both full) }; exactly one new
  pii_reveal_audit row with
  actor_type "customer", actor_id, record_type "lot", record_id, field
- another customer's lot → 404 and no audit row; an open/unsold/cancelled lot → 404 and no audit row; anonymous → 401
- field "phone" → 400 (not in the enum)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- won-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

```text
PARKED (owner reconsidering, 2026-11-16; D-044 on hold). Don't hand off. T-051.7 replaces it now.
Story: US-051 (task T-051.2a)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-051.1a and T-051.3a contracts.

## Acceptance criteria
- AC1: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044) and nothing else, plus the 1×24 h deadline. No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC3: The farmer's bank account is shown masked; the winner reveals the full account number for their own winning lot only, through the logged reveal (D-044). Until the reveal, the winner sees a mask.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /store/won-lots | after T-051.1a | { lots: [{ id, status, final_price, closed_at, pay_by, product, auction, seller: { id, name, payment_details(masked) } }], count } |
| POST | /store/won-lots/:id/reveal | after T-051.3a | { field: "bank_account" } → 200 { field, value: { account_number, holder_name } } |

## Build
- Route /akun/menang (ROUTES.wonLots in const/routes.ts), requireCustomer guard; link from AccountNav.
- Data: lib/data/lots.ts with getAuthHeaders(); typed sdk only, no raw fetch.
- Rows: product, final price (formatPrice), pay-by deadline (formatDeadline), status label, farm name, bank name,
  masked holder name, masked account number + "Tampilkan" button. The reveal fetches on click only (never on render:
  each reveal writes an audit row), then shows the full number and holder name (D-057). Copy the behaviour of admin-koi FarmQueue.tsx:257-313;
  don't import from admin-koi. No phone, no WhatsApp button, no wa.me link (D-052).

## Do not touch
- packages/api/**, apps/admin-koi/**, the sold-lots page (T-051.2b), LivePage/**

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check on /akun/menang as the winner of a closed lot, incl. one reveal click (or "browser NOT verified" and why).
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-051 (task T-051.6)   Release: mvp
Agent: backend   Expected: <=35 min
Starts after: US-050 T-050.1 (winner_customer_id, final_price, closed_at).

## Acceptance criteria
- AC6: The winner sees their own won lots with no farmer contact (no bank account, no holder name, no phone). A winner with no default shipping address sees a prompt on the won lot to add one, linking to `/akun/alamat` (D-056).

## Decisions in force
D-044 on hold (owner, 2026-11-16): no farmer contact; never select seller.phone or seller.payment_details. D-052: no
phone either way. D-046: caller's own data, not a public route; store/lots/** stays winner-free. D-056: the prompt
needs only whether the winner has a default shipping address. D-055: messages a Koi app may show verbatim are
Indonesian. Identity from req.auth_context.actor_id only.

## Build
- GET /store/won-lots (src/api/store/won-lots/route.ts): lots with winner_customer_id = auth_context.actor_id and status
  in the SOLD_STATUSES list (store/lots/route.ts:80). Newest closed first; limit/offset (Zod, max 100).
- middlewares.ts entry authenticate("customer", ["bearer","session"]) as /store/bids.
- Response { lots: [{ id, status, final_price, closed_at, product: { title, thumbnail }, auction: { id, delivery_method },
  seller: { id, name } }], count, has_shipping_address: boolean }. has_shipping_address = the caller has an address with
  is_default_shipping = true (one query.graph on `customer`, fields addresses.is_default_shipping only).
- No pay_by field: the payment deadline waits on the payment model (status block). bun run codegen.

## Start from
- packages/api/src/api/store/bids/route.ts (customer route, auth_context)
- packages/api/src/api/store/lots/route.ts:80 (SOLD_STATUSES)

## Do not touch
- apps/**; src/api/store/lots/**; src/api/vendor/**; src/modules/pii-audit/**; src/api/utils/mask-response.ts

## Spec (packages/api/integration-tests/http/won-lots.spec.ts)
- winner sees own won lot with farm name; has_shipping_address true with a default shipping address, false with none
  or with only a non-default address
- another customer → the lot not listed; open/unsold/cancelled lots not listed; anonymous → 401
- JSON has no `phone` key, no `payment_details` key, not the farm's phone digits or account number

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- won-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

```text
Story: US-051 (task T-051.7)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=35 min
Starts after: T-051.6 contract.

## Acceptance criteria
- AC6: The winner sees their own won lots with no farmer contact (no bank account, no holder name, no phone). A winner with no default shipping address sees a prompt on the won lot to add one, linking to `/akun/alamat` (D-056).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /store/won-lots | after T-051.6 | { lots: [{ id, status, final_price, closed_at, product, auction, seller: { id, name } }], count, has_shipping_address } |

## Build
- Route /akun/menang (ROUTES.wonLots in const/routes.ts), requireCustomer guard; link from AccountNav.
- Data: lib/data/lots.ts with getAuthHeaders(); typed sdk only, no raw fetch.
- Rows: product, final price (formatPrice), closed date, status label, farm name. No bank details, no phone, no
  WhatsApp button, no wa.me link (D-044 on hold, D-052). No payment deadline (waits on the payment model).
- has_shipping_address false → a notice above the list ("Tambahkan alamat pengiriman utama agar peternak bisa mengirim
  ikanmu") with a link to ROUTES.addresses (/akun/alamat).

## Do not touch
- packages/api/**, apps/admin-koi/**, the sold-lots page (T-051.2b), LivePage/**

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check on /akun/menang as the winner of a closed lot, with and without a default shipping address (or "browser
NOT verified" and why).
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-051 (task T-051.4)   Release: mvp
Agent: qa   Expected: <=30 min
Runs after the five live build tasks (T-051.1b, .5, .2b, .6, .7). T-051.1a, .3a, .2a are parked: not tested.

Verify AC2, AC4, AC5, AC6 (AC1, AC3 parked). Decisions: D-039, D-042, D-044 (on hold), D-045, D-052, D-056.
Code under test: src/api/store/won-lots/**, src/api/vendor/sold-lots/**, src/workflows/reveal-lot-address.ts,
storefront /akun/menang and /akun/kebun/terjual.
Commands (alone): bun run test:integration:http -- won-lots; then -- sold-lots; then -- pii-reveal (regression);
bun run check in apps/storefront-koi.
Watch for: any phone (farm's, winner's or the address's, masked or full) or wa.me link in a response or page source;
any farmer bank detail in a won-lot response or page; address_1, address_2 or postal_code in a sold-lots list response
or page source before a reveal; a reveal that returns a value without an audit row (or writes two); another farmer
reaching a lot (must be 404, no audit row); a reveal for a winner with no default address (404, no row); reveal fired
on render; winner_customer_id or email in a vendor response; a second audit table.
Browser: render-check /akun/menang as the winner (with and without a default address) and /akun/kebun/terjual as the
farmer (incl. one address reveal).
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-052 Farmer marks paid and shipped · `todo`
**Depends on:** US-050 T-050.1; US-051 farmer side (T-051.1b, T-051.2b: the sold-lots page), US-092 (masking).
As a **farmer**, I want to mark a lot paid and then shipped so that progress is
tracked. *(Plan: Closing, Delivery; D-052, D-054)*
- AC1: `won → paid → shipped`, in order only.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC3: While shipping, the farmer sees the winner's name and masked address (D-056, US-051); no winner phone, masked or full, and no reveal from this story (D-052). *(Changed 2026-11-16: was "phone masked, full through US-051's reveal".)*
- AC4: A farm suspended after approval can still mark its own already-sold lots paid and shipped; a terminated farm can't (403). It still can't create auctions or lots (D-054).
**Under escrow** (planned direction, 2026-11-16, not a decision): only the "paid" part changes: the farmer marking
paid is replaced by a Xendit webhook, so T-052.4 (and AC1's `won → paid`) is parked. The shipped half, the sold-lots
row and the tracking number are unchanged and buildable now.
- [ ] T-052.1 [backend] `lot.tracking_number` + mark-shipped workflow + `POST /vendor/sold-lots/:id/shipped` (the farmer must own the lot); `won → paid` is T-052.4 *(split 2026-11-16)*
- [ ] T-052.4 [backend] mark-paid workflow + `POST /vendor/sold-lots/:id/paid` *(parked (payment model: Xendit escrow pending, 2026-11-16): under escrow a Xendit webhook sets paid, so AC1's `won → paid` route is not built now)*
- [ ] T-052.2 [storefront] Farmer area actions on the sold-lots page ("Tandai dikirim" builds now; "Tandai sudah dibayar" parked with T-052.4)
- [ ] T-052.3 [qa] States can't be skipped; no winner phone anywhere on the farmer's side (D-052); a suspended farm can finish its sold lots, a terminated one can't (D-054)

**Readiness (2026-11-16): ready (`todo`).** No open question blocks it (`mvp-Q34` → D-052, `mvp-Q36` → D-054).
Sequence: US-050 T-050.1 → US-051 T-051.1b, T-051.2b → this story. AC3 is met by US-051's farmer side (no phone in the
row); this story adds no PII read.
- **Transitions (plan "Lot lifecycle", "Design rules"):** `won → paid`, `paid → shipped`. Nothing else: no `won → shipped`,
  no going back. Each transition is its own workflow under the `lot:<id>` lock, guarded by the current status (409).
- **Tracking number:** plan "Delivery" ("with tracking number for courier"). Courier → required, non-blank. Self-delivery
  → optional. Needs a `tracking_number` column (plan's model table doesn't list it; the Delivery rule requires it).
- **Ownership:** the lot's `auction.seller_id` = `req.seller_context.seller_id`, else 404 (no existence leak), as
  `getVendorAuctionDetail` (`vendor/auctions/[id]/route.ts:30-56`).
- **Suspended farm (D-054, `mvp-Q36`):** the paid and shipped routes are the one exception to the checklist's
  `validateSellerOpenStep`: they must **not** run it. They check instead that the lot belongs to the caller's seller
  (404) and that the seller's status is not `terminated` (403). `SellerStatus` in Mercur 2.3.7 (`@mercurjs/types`
  `seller/common.d.ts`) is `open | pending_approval | suspended | terminated`, so `TERMINATED` exists. A rejected farm
  (D-015, `suspended`) owns no sold lot, so ownership refuses it.
- No deadline and no strike here: non-payment is US-058, not shipping a paid lot is US-059.

#### Briefs

```text
Story: US-052 (task T-052.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-050 T-050.1 (setLotFieldsStep, steps/lot.ts) and US-051 T-051.1b (GET /vendor/sold-lots, row shape).
Split 2026-11-16: this brief builds `paid → shipped` only; `won → paid` is T-052.4, parked.

## Acceptance criteria
- AC1 (shipped half): `paid → shipped` only, from `paid`; no skipped or backward state.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC4: A farm suspended after approval can still mark its own already-sold lots paid and shipped; a terminated farm can't (403). It still can't create auctions or lots (D-054).

## Decisions in force
plan "Lot lifecycle" / "Design rules": `won → paid → shipped`; CLAUDE.md §8: explicit transitions, no skipped state.
plan "Closing and winners": the farmer marks the lot paid, then shipped. plan "Delivery": tracking number for courier.
D-003: seller from req.seller_context, never the body. D-026: winner and final_price never change here.
D-054: a suspended farm may finish its sold lots: do NOT use validateSellerOpenStep here (the checklist's one
exception); check ownership (404) and seller.status !== SellerStatus.TERMINATED (403) instead.
D-052: the response row has no winner phone. D-055: messages a Koi app may show verbatim are Indonesian.

## Build
- Lot model: `tracking_number: model.text().nullable()`; migration (`bunx medusa db:generate auction`).
- src/workflows/mark-lot-sold-status.ts, one workflow:
  markLotShippedWorkflow({ seller_id, lot_id, tracking_number? }):
  acquireLockStep `lot:<id>` → guard step (read only: seller status by query.graph on `seller` as
  validate-seller-open.ts:20-26, `SellerStatus.TERMINATED` → 403 FORBIDDEN code `seller_terminated`, Indonesian
  message; lot with auction.seller_id and auction.delivery_method; not this seller's → 404; status !== expected
  from-status `paid` → 409 `invalid_lot_status`; courier + blank tracking → 400 `tracking_number_required`) →
  setLotFieldsStep({ status: "shipped", tracking_number: trimmed or null }) → releaseLockStep.
- Route (POST, both generics typed): /vendor/sold-lots/:id/shipped, body Zod { tracking_number?: string trimmed,
  max 100 } in middlewares.ts (T-052.4 adds /:id/paid later). Response { lot: <the GET /vendor/sold-lots row> } — reuse T-051.1b's mapper; add tracking_number
  to that row. Import "../../../../../types/seller-context". bun run codegen.

## Start from
- packages/api/src/workflows/start-auction.ts (lock + guard + when); src/workflows/steps/lot.ts (setLotFieldsStep, T-050.1)
- packages/api/src/workflows/steps/validate-seller-open.ts:16-35 (seller status read; copy the read, not the step)
- packages/api/src/api/vendor/auctions/[id]/submit/route.ts (vendor POST route shape)
- packages/api/src/api/vendor/sold-lots/route.ts (T-051.1b)

## Do not touch
- apps/**; src/workflows/close-lot.ts, place-bid.ts; src/modules/pii-audit/**; src/api/utils/mask-response.ts

## Spec (packages/api/integration-tests/http/sold-lots.spec.ts, describe "shipped")
- lot seeded `paid`, ship courier with tracking "JNE123" → 200, status shipped, tracking saved
- won → shipped → 409, status still won; shipped twice → 409; shipped on an `unsold`/`open` lot → 409
- courier with no / blank tracking → 400, status still paid; self_delivery with no tracking → 200
- another seller's lot → 404, unchanged; winner_customer_id and final_price unchanged after both transitions
- forced failure after setLotFieldsStep (farmer-auctions.spec.ts:18-34 pattern) → status restored
- seller suspended after the lot was won → shipped still 200 (D-054); seller suspended then terminated (Mercur
  refuses terminating an `open` seller) → 403, status unchanged

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- sold-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (both routes, errors).

## Open questions
none
```

```text
Story: US-052 (task T-052.4)   Release: mvp
Agent: backend   Expected: <=35 min
Starts after: T-052.1 (the mark-lot-sold-status.ts workflow file and routes).
PARKED (payment model: Xendit escrow pending, 2026-11-16). Don't hand off. Under escrow a Xendit webhook sets paid,
so this route is likely dropped, not adapted.

## Acceptance criteria
- AC1 (paid half): `won → paid`, in order only.
- AC4: a suspended farm may still mark its own sold lots paid; a terminated farm can't (403) (D-054).

## Decisions in force
plan "Lot lifecycle"; CLAUDE.md §8 explicit transitions. D-003: seller from req.seller_context. D-054: no
validateSellerOpenStep; ownership (404) + status !== TERMINATED (403). D-055: Indonesian messages.

## Build
- Same file as T-052.1: markLotPaidWorkflow({ seller_id, lot_id }): lock `lot:<id>` → same guard step, from-status
  `won` → setLotFieldsStep({ status: "paid" }) → release. Reuse T-052.1's guard step and row mapper.
- Route POST /vendor/sold-lots/:id/paid, no body (strict empty body as store/auctions/[id]/join/route.ts:45-51).
  bun run codegen.

## Spec (sold-lots.spec.ts, describe "paid")
- won → paid → 200, status paid; won → shipped → 409; paid twice → 409; another seller's lot → 404
- suspended seller → 200; terminated → 403 (D-054)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen; bun run test:integration:http -- sold-lots → pass (alone)
Report: standard header + API contract.

## Open questions
none
```

```text
Story: US-052 (task T-052.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=40 min
Starts after: T-052.1 contract and US-051 T-051.2b (the page).

## Acceptance criteria
- AC1: `won → paid → shipped`, in order only.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC3: While shipping, the farmer sees the winner's name and masked address (D-056, US-051); no winner phone, masked or full, and no reveal from this story (D-052). *(Changed 2026-11-16: was "phone masked, full through US-051's reveal".)*

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /vendor/sold-lots | after T-051.1b | rows incl. status, auction.delivery_method, tracking_number (T-052.1), winner.name (no phone, D-052) |
| POST | /vendor/sold-lots/:id/paid | after T-052.1 | no body → { lot } ; 409 wrong status |
| POST | /vendor/sold-lots/:id/shipped | after T-052.1 | { tracking_number? } → { lot } ; 400 tracking_number_required, 403 seller_terminated, 409 |

## Build
- On /akun/kebun/terjual rows: `won` → "Tandai sudah dibayar"; `paid` → "Tandai dikirim" with a tracking input
  (required, shown only for courier); `shipped`/later → status label + tracking number. Server action → typed sdk
  with vendorHeaders(); router.refresh() after success; 409 → "Status lot sudah berubah" + refresh.
- No phone, no reveal, no WhatsApp/wa.me link on the row (D-052). A suspended farm still sees the actions (D-054);
  403 → show the server's (Indonesian, D-055) message.

## Do not touch
- packages/api/**, apps/admin-koi/**, the won-lots page (US-051 T-051.2a)

## Definition of done
cd apps/storefront-koi && bun run check → pass
render-check on /akun/kebun/terjual as sakura.koi.farm@koi.dev, incl. one paid and one shipped submit (or "browser NOT
verified" and why). Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-052 (task T-052.3)   Release: mvp
Agent: qa   Expected: <=30 min
Verify AC1–AC4. Decisions: plan "Lot lifecycle", "Delivery", D-039, D-042, D-052, D-054.
Commands (alone): bun run test:integration:http -- sold-lots; bun run check in apps/storefront-koi.
Watch for: any skipped or backward transition; courier shipped without tracking; another seller's lot changing; any
winner phone (masked or full) in the list or page source; winner_customer_id/final_price changed; the paid/shipped
workflows using validateSellerOpenStep (would lock out a suspended farm, D-054); a terminated farm let through.
Browser: render-check /akun/kebun/terjual as the farmer, walk won → paid → shipped.
```

### US-053 Winner marks delivered · `todo`
As a **winner**, I want to mark the fish delivered so that the sale completes and
the claim window starts. *(Plan: Delivery)*
- AC1: Only the winner can mark `shipped → delivered`.
- [ ] T-053.1 [backend] `lot.delivered_at` + delivered workflow + `POST /store/won-lots/:id/delivered`
- [ ] T-053.2 [storefront] Button on the won lot *(unblocked 2026-11-16, D-052; starts after US-051 T-051.7, its page now that T-051.2a is parked)*
- [ ] T-053.3 [qa] Only the winner, only from `shipped`; `delivered_at` saved *(new task 2026-11-16: the story had no qa task)*

**Readiness (2026-11-16): `todo`; T-053.1 ready, T-053.2 ready after US-051 T-051.7 (mvp-Q34 → D-052; T-051.2a is
parked, so the page is T-051.7's no-contact `/akun/menang`).** The rule is plain: plan "Delivery" (the
winner marks it delivered) and the lifecycle `shipped → delivered`. `delivered_at` is saved because the claim window
runs "within 4 hours of marking it delivered" (plan "Dead-on-arrival claims" 1, US-054 AC1); the lot has no such
column. A winner who never marks delivered: **nothing** in the MVP, the lot stays `shipped` (D-053, `mvp-Q35`). No job,
no auto-confirm, no setting; don't add one. "Auto-confirm delivery after N days" waits in `docs/releases/README.md`,
Ideas not yet planned. `delivered → claimed` is US-054.

#### Briefs

```text
Story: US-053 (task T-053.1)   Release: mvp
Agent: backend   Expected: <=35 min
Starts after: US-052 T-052.1 (a lot can reach `shipped`); US-050 T-050.1 (setLotFieldsStep).

## Acceptance criteria
- AC1: Only the winner can mark `shipped → delivered`.

## Decisions in force
plan "Delivery" + lifecycle `shipped → delivered`; CLAUDE.md §8 explicit transitions, save the time when it happens.
Identity from req.auth_context.actor_id (customer token), never the body. D-046: no winner field on public routes.

## Build
- Lot model: `delivered_at: model.dateTime().nullable()`; migration.
- src/workflows/mark-lot-delivered.ts markLotDeliveredWorkflow({ customer_id, lot_id }): lock `lot:<id>` → guard
  (read only: lot.winner_customer_id !== customer_id → 404 (no existence leak); status !== "shipped" → 409
  `invalid_lot_status`) → setLotFieldsStep({ status: "delivered", delivered_at: now }) → release.
- Route src/api/store/won-lots/[id]/delivered/route.ts (POST, no body, strict empty body like join/route.ts:45-51);
  middlewares.ts entry authenticate("customer", ["bearer","session"]) as /store/bids (:281-288).
  Response { lot: { id, status, delivered_at } } (the full won-lot row is T-051.1a's; no phone in it, D-052). bun run codegen.
- D-053: no job, no deadline, no setting for a lot that is never marked delivered. D-055: messages a Koi app may show
  verbatim are Indonesian.

## Start from
- packages/api/src/workflows/start-auction.ts; src/workflows/steps/lot.ts (T-050.1)
- packages/api/src/api/store/auctions/[id]/join/route.ts (customer POST route)

## Do not touch
- apps/**; src/api/store/lots/**; src/api/vendor/**; src/modules/pii-audit/**

## Spec (packages/api/integration-tests/http/won-lot-delivered.spec.ts)
- winner on a shipped lot → 200, status delivered, delivered_at ≈ now
- another customer → 404, unchanged; anonymous → 401
- winner on won / paid / delivered lot → 409, unchanged
- forced failure after setLotFieldsStep → status shipped, delivered_at null

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- won-lot-delivered → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract.

## Open questions
none
```

T-053.2 (unblocked by D-052; starts after US-051 T-051.7): a "Sudah diterima" button on `/akun/menang` rows with
status `shipped`, calling `POST /store/won-lots/:id/delivered`; 409 → refresh. Full brief written when T-051.7's page
exists. Under Xendit escrow this click becomes the payout trigger (planned direction, not a decision).

```text
Story: US-053 (task T-053.3)   Release: mvp
Agent: qa   Expected: <=20 min
Verify AC1. Commands (alone): bun run test:integration:http -- won-lot-delivered. Browser: after T-053.2.
Watch for: a non-winner or the farmer able to mark delivered; delivered from any status but shipped; delivered_at
missing or overwritten on a repeat.
```

### US-054 Winner opens a dead-on-arrival claim · `todo`
As a **winner**, I want to claim within 4 hours if the fish arrives dead or sick
so that I get a refund or a replacement. *(Plan: Dead-on-arrival claims 1–3, Design rules; D-025, D-027)*
- AC1: A claim is allowed only within the claim window (4 h, a setting) after delivered.
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
- AC4: A new claim has status `open`. The claim enum is `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038).
- [ ] T-054.1 [backend] Moderation module: `claim` model with the D-038 status enum + open-claim workflow; video stored on the VPS file provider
- [ ] T-054.2 [storefront] Claim form with video upload and size limit; open claims listed in the Farmer area
- [ ] T-054.4 [admin] `/klaim` queue lists open claims
- [ ] T-054.3 [qa] Late claims and oversized videos are rejected on the server; a new claim is `open` and shows in the Farmer area and the admin queue

### US-055 Farmer responds and admin decides disputes · `todo`
As a **farmer**, I want to accept or dispute a claim, and as an **admin**, I want
to decide disputes, so that claims are fair. *(Plan: Dead-on-arrival claims 3; D-038)*
- AC1: The farmer can accept, which moves the claim straight to `approved` with no admin step, or dispute (`open → disputed`) (D-038).
- AC2: Only a disputed claim goes to admin, whose decision (`approved` or `rejected`) is final and saved with a reason.
- [ ] T-055.1 [backend] Claim decision workflows + routes (store for the farmer, admin for disputes); transitions follow D-038 only; `approved_at` saved on both paths
- [ ] T-055.2 [storefront] Farmer area claim review with the video
- [ ] T-055.3 [admin] `/klaim` dispute screen
- [ ] T-055.4 [qa] Farmer accept gives `approved` directly; admin can't decide a claim that isn't `disputed`

### US-056 Approved claims are resolved · `parked (payment model: Xendit escrow pending, 2026-11-16)`
**Under escrow** (planned direction, 2026-11-16, not a decision): the refund comes out of the held funds, not from the
farmer directly, so AC1's "the farmer refunds directly" path is replaced by a platform refund from escrow. Replacement
not designed; don't build the farmer-refund path.
As a **winner**, I want an approved claim settled within 3 days so that I'm made
whole. *(Plan: Dead-on-arrival claims 4–6; D-027, D-038)*
- AC1: The farmer has 3 days to refund directly or ship a replacement, then marks it done (`approved → resolved`). The winner confirms (`resolved → confirmed`). The 3 days start when the claim becomes `approved`, on both paths (D-038).
- AC2: Missing the 3 days, or refusing an approved claim, makes the farmer eligible for a strike (US-059).
- AC3: The farmer stays responsible even if a courier caused the death.
- AC4: If the winner doesn't confirm within 3 days of `resolved`, the existing scheduled job sets the claim to `confirmed` (D-027).
- [ ] T-056.1 [backend] Claim resolution states + the farmer deadline check and the 3-day auto-confirm in the existing scheduled job (idempotent, batched)
- [ ] T-056.2 [storefront] Mark done (farmer) and confirm (winner)
- [ ] T-056.3 [admin] Overdue claims are flagged for a strike
- [ ] T-056.4 [qa] A `resolved` claim older than 3 days becomes `confirmed` once; running the job twice changes nothing

### US-057 Winner rates the farmer · `todo`
**Depends on:** US-092 (masking on the public farm page).
As a **winner**, I want to rate the farmer after shipping so that other buyers
can judge farms. *(Plan: Ratings)*
- AC1: Available once the lot is `shipped`: 1–5 stars and a comment, once per lot.
- AC2: Ratings show on the farm's page (`mitra/[handle]`).
**PII (D-039):** anything this story shows about the rater beyond a display name (phone, NIK) is masked, because `mitra/[handle]` is a public page. US-092 delivers it.
- [ ] T-057.1 [backend] `farmer_rating` model + workflow + routes
- [ ] T-057.2 [storefront] Rating form + display on the partner page

### US-058 Farmer reports a winner who didn't pay · `parked (payment model: Xendit escrow pending, 2026-11-16)`
**Under escrow** (planned direction, 2026-11-16, not a decision): the payment deadline comes from the Xendit invoice
expiry, so "report after 1×24 h" and AC1's deadline are replaced by the invoice's expiry. Not designed; don't build the
manual deadline check.
As a **farmer**, I want to report a winner who didn't pay within 1×24 h so that
admin can act. *(Plan: Winner doesn't pay; D-026)*
- AC1: The farmer can report after the deadline. The admin reviews it and may give a strike.
- AC2: Any offer to the second-highest bidder is fully off-platform. The platform records nothing about it and never reassigns the lot; winner and final price stay as saved at close (D-026).
- [ ] T-058.1 [backend] Report model/state + routes
- [ ] T-058.2 [storefront] Report button after the deadline
- [ ] T-058.3 [admin] Report review that leads to a strike

### US-059 Strikes and bans · `todo` (the "winner didn't pay" strike part parked with US-058, 2026-11-16)
As an **admin**, I want to give strikes after checking a report so that repeat
offenders are banned. *(Plan: Strikes)*
- AC1: Admin gives each strike with a reason (winner: didn't pay; farmer: didn't ship a paid lot, or refused an approved claim). *(The "winner didn't pay" reason is parked with US-058: under escrow the deadline comes from the Xendit invoice expiry. Farmer reasons build now.)*
- AC2: 2 active strikes = ban. A banned winner can't join or bid. A banned farmer can't create auctions.
- AC3: Strikes expire after 6 months. Admin can remove a strike with a reason.
- AC4: Every ban and every suspend needs a written reason, the same rule as a farm rejection (D-041). admin-koi refuses the action without one.
- [ ] T-059.1 [backend] `strike` model + give/remove workflows + an active-strike check used by join, bid and create; every suspend and ban passes `reason` (D-041). Adds the ban check into US-041's join workflow and US-042's place-bid workflow (D-047); those stories ship without it
- [ ] T-059.2 [admin] Strike actions on reports and users
- [ ] T-059.3 [qa] An expired strike no longer counts; the ban lifts when active strikes drop below 2; a banned customer's join and bid are refused (US-041 AC4 and US-042 AC1 ban clauses, D-047)

### US-060 Farmer cancels an auction · `todo`
As a **farmer**, I want to cancel my auction before it starts so that I can
withdraw it, with joiners refunded. *(Plan: Cancellations, Refunds in the MVP; D-022, D-031)*
- AC1: Every customer who joined gets a `refund` (+) of their join fee.
- AC2: The farmer's listing fee isn't refunded.
- AC3: The farmer can cancel only while the auction is `draft`, `pending_approval` or `scheduled`. Once it is `live`, the farmer's cancel is refused; only an admin can cancel it (D-022, D-031, US-091).
- [ ] T-060.1 [backend] Cancel workflow: refuse unless `draft`, `pending_approval` or `scheduled`, refund each participant, set status `cancelled`
- [ ] T-060.2 [storefront] Cancel action in the Farmer area, hidden once the auction is `live`
- [ ] T-060.3 [qa] Refunds total exactly the join fees collected; no `listing_fee` refund is written; a farmer cancel on a `live` auction is refused on the server

### US-061 Claim videos are cleaned up · `todo`
As the **platform**, I want claim videos deleted 30 days after a claim closes so
that storage stays bounded. *(Plan: Dead-on-arrival claims 7; D-027)*
- AC1: A claim is closed when its status is `confirmed` or `rejected` (D-027). Its video is deleted 30 days after it closed; the claim record stays.
- [ ] T-061.1 [backend] The scheduled job deletes the files and keeps the claim record
- [ ] T-061.2 [qa] Only `confirmed` or `rejected` claims closed more than 30 days ago are affected

---

## Epic 6: Admin operations (Milestone 6)

### US-070 Admin manages users · `todo`
**Depends on:** US-092 (masking of phone and NIK; the full value only through the logged reveal, D-042).
As an **admin**, I want to see users with their strikes and bans so that I can
act on bad actors. *(Plan: Users and roles, Strikes)*
**PII (D-039, D-042):** phone and NIK on these screens are masked, as on every admin route; the full value only through the logged reveal. US-092 applies.
- [ ] T-070.1 [backend] `/admin` user list and detail with wallet, strikes and ban status
- [ ] T-070.2 [admin] `/pengguna` screens

### US-071 Admin spots shill bidding · `todo`
As an **admin**, I want to see bid patterns per bidder and farmer so that I can
spot shill bidding. *(Plan: Fair play; D-028, D-037)*
**Depends on:** US-058 (non-payment reports).
- AC1: For each farmer, a bidder table shows bidder, bid count, lots bid on, wins and unpaid wins. An unpaid win is a non-payment report from that farmer on that bidder (US-058). Every count covers all time (D-037).
- AC2: A bidder is flagged when at least 50% of their bids are on that farmer's lots, or when they have at least 2 unpaid wins from that farmer.
- AC3: Flags take no automatic action. The admin bans by hand (US-059, US-070).
- [ ] T-071.1 [backend] `/admin` read route: per-farmer bidder table with the two flags (read only, `query.graph`)
- [ ] T-071.2 [admin] Bidder table on the farmer page, flagged rows marked
- [ ] T-071.3 [qa] Flag thresholds at exactly 50% and exactly 2 unpaid wins; a flag changes no account

### US-072 Admin monitors live auctions and removes wrong bids · `todo`
As an **admin**, I want to watch live auctions and remove obviously wrong bids
so that auctions stay fair. *(Plan: Bidding, Milestone 6; D-024, D-036)*
- AC1: Removing a bid is allowed only for an obvious error, and needs a reason.
- AC2: A removed bid is marked removed (with reason, admin and time), never deleted. Removed bids don't count for the current price, the winner or the bid history shown to customers.
- AC3: The lot's current price goes back to the highest remaining bid, or OB if none is left (D-024).
- AC4: Any extend the removed bid caused stays. The lot's end time is never shortened (D-024).
- AC5: A bid can be removed only while its lot is `open`. After close, removal is refused; the fix is a lot cancel (US-091). Once every bid is removed, the next bid may equal OB again (D-036, D-023).
- [ ] T-072.1 [backend] Remove-bid workflow (row lock on the lot, mark removed, recompute current price) + `/admin` route
- [ ] T-072.2 [admin] Live monitoring screen with remove-bid and a required reason
- [ ] T-072.3 [qa] After removal: bid row still exists and is marked removed; price = highest remaining bid or OB; end time unchanged; removal on a closed lot refused; after removing every bid, a bid = OB is accepted

### US-091 Admin cancels lots and live auctions · `todo`
**Depends on:** US-092 (masking of bidder details; the full value only through the logged reveal, D-042).
As an **admin**, I want to cancel a lot that has bids, or a live auction, so that
a broken listing can be stopped. *(Plan: Cancellations, Lot lifecycle; D-022, D-034, D-035)*
- AC1: Only admin can cancel a lot: `open → cancelled`, with a saved reason and no winner (D-035).
- AC2: Once an auction is `live`, only admin can cancel it (D-022).
- AC3: An admin cancel of an auction refunds every participant's join fee as a `refund` (+), the same as a farmer cancel. The listing fee is not refunded (D-034).
**Answered `mvp-Q32` (D-050):** a cancelled lot inside a public auction stays on `/store/lots` and its lot page, labelled "Dibatalkan", with no price, final price, sold label, winner or bids. US-040 T-040.1/2a/2b already return and render it; this story only produces the cancelled lots (no change needed on the public pages).
**PII (D-039, D-042):** bidder and participant details shown on the cancel and monitoring screens are masked, as on every admin route; the full value only through the logged reveal. US-092 delivers it.
- [ ] T-091.1 [backend] Cancel-lot and cancel-live-auction workflows + `/admin` routes (moved from T-072.1)
- [ ] T-091.2 [admin] Cancel actions with a required reason on the live monitoring screen
- [ ] T-091.3 [qa] A farmer can't reach either cancel; a cancelled lot has no winner and is skipped by the close job; refunds total exactly the join fees collected; no `listing_fee` refund; statuses follow the plan's enums only; after the cancel, the lot is still on `/lelang` and its lot page is 200 with "Dibatalkan" and no price (D-050, US-040 already renders it)

### US-092 Personal data is encrypted and masked · `todo`
As a **customer**, I want my personal data encrypted at rest and hidden behind
masks everywhere it is shown, so that a leak or a stolen screenshot exposes
little of it. *(Plan: Personal data protection; D-039, D-040, D-042, D-043, D-045)*
- AC1: NIK, bank account number and account-holder name, and phone are encrypted at **column level**, on top of the database's disk encryption; a direct database read shows ciphertext, not the value (D-043). **Not built yet.**
- AC2: The existing wallet and top-up tables are covered in the same story; their plain values are migrated by a one-off script that encrypts in place, verifies, and leaves no plaintext copy (D-043). **Not built yet.**
- AC3: No API result returns a full PII value to any client except the owner's own record; `/admin/*` included, admins get the mask. Each returns a masked form (a short prefix/suffix or last-4, the rest hidden) or nothing. The KTP photo is only ever a private file, never a URL. Self-view is the only unmasked path and is limited to the owner's own phone and own bank details on `/store/customers/me` and the farmer's own `/vendor/sellers*` record (D-045).
- AC4: Every screen in `apps/storefront-koi` and `apps/admin-koi` renders the masked value only, except the owner's own full value on their own account and farm-registration screens (D-045); no page source or client payload holds another person's full value. Admins are not exempt (D-042).
- AC5: A full value of someone else's PII is reachable only through an explicit reveal route. It is **required**, not optional, and records who, when, which record and which field in an append-only audit table (D-042). Its only callers are an admin reveal and a winner's reveal of their own won lot's bank account (D-044, US-051). *(Changed 2026-11-16: the farmer's reveal of the winner's phone is dropped, D-052.)*
- AC6: Encryption keys come from the environment, not the database or the repo; `.env.template` gets a placeholder (root `CLAUDE.md` §11).
- AC7: `/admin/sellers*` responses do not return unmasked `payout_account.data`, because that free-form JSON can hold a bank number or a phone; it is masked like the other PII fields. `professional_details` (`corporate_name`, `registration_number`, `tax_id`) stays unmasked deliberately — out of scope unless the owner says otherwise.
**Status note:** masking is the part that lands here; column-level encryption (AC1, AC2; T-092.1, T-092.6) is **still not built**. Don't read this story as complete while encryption is missing. Still open as of US-021 acceptance (2026-11-15): T-092.1/T-092.6 column encryption, and T-092.9 `/admin/sellers*` `payout_account.data` masking.
- [ ] T-092.1 [backend] Column-level encryption for the PII fields — NIK, bank account number and account-holder name, phone — on the seller/custom-field, wallet and top-up tables; encrypt on write, decrypt only inside the server (D-043) — **open**
- [ ] T-092.2 [backend] Masking in every API result that carries PII: `/store/*`, `/vendor/*`, `/admin/*`; admins get the mask too (D-042); owner's own record is the only unmasked result (D-045)
- [ ] T-092.3 [admin] Masked rendering on every admin-koi screen that shows PII (`/kebun`, `/pengguna`, `/saldo/*`, live monitoring, cancel), plus the reveal button wired to the audit-logged route
- [ ] T-092.4 [storefront] Account screen (`/store/customers/me`) and farm-registration screen show the owner's own full phone and own bank details (self-view, D-045); any PII about someone else shown on storefront screens stays masked, e.g. the won-lot screens in US-051
- [ ] T-092.5 [backend] Reveal route (`/admin/*` and the farmer's own-lot address reveal, D-056) writing an append-only audit entry (who, when, record, field) (D-042; the winner's bank reveal, D-044, is on hold)
- [ ] T-092.6 [backend] One-off migration script that encrypts the existing plain PII values in the wallet and top-up tables in place, verifies, and leaves no plaintext copy (D-043) — **open**
- [ ] T-092.7 [qa] A direct DB read shows ciphertext; every PII-bearing API response shows only the mask, admin routes included, except the owner's own record; the key is not committed; the KTP photo is still only a private file key (D-040)
- [ ] T-092.8 [qa] Every admin-koi and storefront screen that shows PII renders only the mask, except the owner's own full value on their own account and farm-registration screens; a reveal writes exactly one audit row with who, when, record and field; the migration leaves no plaintext
- [ ] T-092.9 [backend] Mask `payout_account.data` on every `/admin/sellers*` response (free-form JSON can hold a bank number or phone); leave `professional_details` unmasked (AC7)

### US-093 Orphan KTP uploads are cleaned up · `todo`
As the **platform**, I want KTP photos never attached to a seller deleted after a
while, so that stray uploads don't pile up forever. *(Plan: Personal data
protection; owner follow-up 2026-11-15. Low priority, not in the current
milestone order.)*
**Note:** the `ponytail:` comment in `packages/api/src/api/store/farm-uploads/route.ts:33-35` stays until this story lands.
- AC1: A private `ktp` file with no seller reference and older than a set age is deleted; nothing that is referenced is touched.
- AC2: The job runs on a schedule, is idempotent and batches large sets.
- AC3: A KTP attached to a seller, or a public farm photo, is never deleted.
- [ ] T-093.1 [backend] Scheduled cleanup job over `private-uploads/` KTP files with no seller reference (idempotent, batched)
- [ ] T-093.2 [qa] An orphan older than the age is deleted; a referenced one and a public farm photo are not

---

## Epic 7: WhatsApp bot (Milestone 7)

### US-080 WhatsApp number linked to an account · `blocked (mvp-Q12)`
As a **customer**, I want my WhatsApp number linked to my account so that I can
bid by WhatsApp. *(Plan: WhatsApp bot: Identity)*
- AC1: One number links to one account. The number is the phone given at registration (D-008, US-002 AC3).
- AC2: Messages from unknown numbers get a registration link.
- AC3: The webhook answers within 5 s. Slow work runs after the acknowledgement.
- AC4: Each incoming message is processed once: duplicates are dropped by message `id`.
- AC5: A bid's server time is recorded when the webhook receives it, not when it is processed.
- AC6: Non-command messages and messages in rooms assigned to an agent are ignored by the bot.
- [ ] T-080.1 [ops] Confirm the Qontak API supports incoming messages and template sends, and which plan includes it
- [ ] T-080.2 [ops] Dedicated business number + verified Meta Business account. Owner starts Meta Business verification now (up to 14 business days; D-029)
- [ ] T-080.5 [ops] Owner gets the written Qontak quote: price, Bot + User tokens, webhook access, webhook retry and signature, rate limits, utility charging inside the window, onboarding time (D-029; the bot epic waits for it)
- [ ] T-080.3 [backend] Qontak webhook route (`message_interactions`) + number-to-account lookup. Store both the Bot token (bot replies) and the User token (template sends), refresh them, and keep the API base URL in config (Qontak announced an undated move to `api.mekari.com` with HMAC auth)
- [ ] T-080.4 [qa] Webhook acknowledges within 5 s, drops a duplicate message `id`, ignores non-command and agent-assigned messages

### US-081 Bot sends lot codes on join · `blocked (mvp-Q12)`
- AC1: After joining, the user gets the auction's lots with codes and how to bid (`BID A3 5000000`).
- AC2: The message is an approved utility template, because joining happens on the website, so no 24 h window is open.
- [ ] T-081.1 [backend] Subscriber on join sends the template
- [ ] T-081.2 [ops] Submit the lot-codes utility template to Meta for review (up to 24 h; can't be edited after submission; Meta may reclassify it as marketing)

### US-082 Bid by WhatsApp · `blocked (mvp-Q12)`
- AC1: `BID <lot> <amount>` goes through the same place-bid workflow as the web, with source `whatsapp`.
- AC2: The bot replies "accepted", or "rejected" with the current price.
- [ ] T-082.1 [backend] Command parser that calls the existing workflow (no second rule set)
- [ ] T-082.2 [qa] Web and WhatsApp bids follow identical rules

### US-083 Outbid alert · `blocked (mvp-Q12)`
- AC1: When outbid, the user gets the lot, the new price and a ready-to-send `BID` command.
- AC2: Alerts respect Meta's limits: at most 1 message per user every 6 s, and 250 unique users per 24 h outside the window until business verification (then 2,000). Several outbids for one user inside that gap are coalesced into one alert with the latest price.
- [ ] T-083.1 [backend] Subscriber on the outbid event + utility template

### US-084 Status command · `blocked (mvp-Q12)`
- AC1: `STATUS <lot>` returns the current price and time left.
- [ ] T-084.1 [backend] Command handler (read only)

### US-085 Win message · `blocked (mvp-Q12)`
- AC1: The winner gets the farmer's WhatsApp and bank details and the 1×24 h deadline. *(Conflicts with D-052 and D-044; to be rewritten when `mvp-Q38` is answered. Don't build as written.)*
- [ ] T-085.1 [backend] Subscriber on lot won + utility template

The website must work without WhatsApp. The bot can launch after the web.

**Qontak research (T-080.1, 2026-11-14, official sources).**
- Capability: inbound webhook `message_interactions`; free-form bot replies inside the 24 h window via `POST /v1/messages/whatsapp/bot` (Bot token); template sends via `POST /v1/broadcasts/whatsapp/direct` (User token). On all plans with a WhatsApp channel.
- Price not settled: the official page shows Service Suite Plus at Rp2.000.000/month with a 5-user minimum, otherwise a quote. The plan's "about Rp599.000/month" isn't on Qontak's official pricing page.
- Per message from 2026-10-01 (Qontak, non-Lite): Service Rp356,65, Utility Rp366,65, Marketing Rp627,33. Service messages, including bot replies, are now charged, with 1,000 free per number per month. Meta says utility messages inside an open window are charged; Qontak's article says otherwise. VAT not verified.
- Webhook: answer within 5 s; no signature or retry policy documented; dedupe on message `id`.
- Meta: 1 message per 6 s per user; 250 unique users per 24 h outside the window until business verification (then 2,000). Business verification up to 14 business days. Template review up to 24 h.
- Alternative (not chosen, D-029): Meta Cloud API direct, with the same capabilities, signed webhooks (`X-Hub-Signature-256`), retries and no platform fee. Twilio bills in USD. Fonnte and Wablas are unofficial (ruled out by D-006).

---

## Epic 8: Pilot (Milestone 8)

### US-090 Pilot with friendly farmers · `todo`
- AC1: One or two farmers run real auctions end to end before public launch.
- [ ] T-090.1 [ops] Pilot checklist: register, top up, farm approval, auction, bids, close, pay, ship, deliver
- [ ] T-090.2 [ops] Upgrade routine from the plan: backup, rehearse on a copy, deploy with no live auction, compare wallet totals
- [ ] T-090.3 [ops] Private-access file provider in production for KTP photos and top-up screenshots (D-017, D-018). The local dev provider has no real access control; choose the provider and configure it before launch
- [ ] T-090.4 [ops] Shared locking provider (e.g. redis) in production if more than one backend instance runs. Today's lock is in-memory and only serialises within one process (top-up decisions US-012, wallet creation, settings)
- [ ] T-090.5 [ops] Before launch, check for wallets whose balance went below Rp0 before D-019 (dev data only, if any). D-019 lets such a wallet receive only positive corrections, so fix or reset them before real money flows

---

## Unplanned

Fixes and small changes made during this release that aren't in the plan.

**Pending cleanup (no story):** `apps/admin-koi/src/app/layout.tsx` has a
formatting-only diff (import order, a split `robots` object) that isn't part of
any story. Revert it when the owner approves; the classifier blocked the attempt.

## Coverage matrix

Every plan section maps to at least one story. The product owner keeps this
table complete.

| Plan section | Stories |
|---|---|
| Users and roles | US-002, US-020, US-021, US-070 |
| Personal data protection (column encryption on top of disk; masked everywhere incl. admin; logged reveal; self-view; no phone between winner and farmer; farmer gets the winner's saved address; D-039, D-042, D-043, D-044 (on hold), D-045, D-052, D-056, D-057) | US-092, US-020, US-021, US-010 – US-013, US-051, US-052, US-057, US-070, US-091 |
| Orphan upload cleanup (owner follow-up) | US-093 |
| Becoming a farmer | US-020, US-021 |
| Store credit wallet: how credit moves (4 join, 5 submit/approve, D-020, D-031–D-033) | US-010, US-011, US-012, US-015, US-031, US-032, US-041 |
| Transaction types (`manual_topup`, `join_fee`, `listing_fee`, `adjustment`, `refund`) | US-012, US-041, US-031, US-013, US-060, US-091 |
| Wallet rules (integer, append-only, closed loop) | Epic 1 rules, US-010, US-013 |
| Refunds in the MVP (farmer or admin cancel, D-034; none on rejection or lowered fee, D-020) | US-060, US-091, US-031 |
| Fees and fee table (recomputed at submit, override cleared on rejection, D-032) | US-014, US-030, US-031, US-032, US-041 |
| Lot lifecycle and statuses (incl. `cancelled`, D-035; a cancelled lot stays public as "Dibatalkan", D-050; bidding ends when the timer ends, US-043 AC4) | US-033, US-043, US-050, US-052, US-053, US-054, US-091, US-040 |
| Auction statuses (`pending_approval`, rejection back to `draft`, D-031) | US-030, US-031, US-032, US-033, US-060 |
| Claim statuses (D-027, D-038) | US-054, US-055, US-056, US-061 |
| Structure (20 lots, 1–7 days, approval, rejection, approval refused after start D-049, join while scheduled or live D-048, public statuses D-046, cancelled lot public D-050) | US-015, US-030, US-032, US-040, US-041, US-091 |
| Pricing per lot (OB, KB, first bid = OB, D-023) | US-030, US-042 |
| Bidding (incl. bid removal, D-024, D-036; masked bidders and full history, D-051) | US-042, US-044, US-072 |
| Extend (anti-sniping) | US-043, US-015, US-030 |
| Fair play (incl. shill-bidding table, D-028, D-037; ban check on join and bid lands with strikes, D-047) | US-041, US-042, US-059, US-071 |
| Closing and winners (no phone either way, D-052; farmer gets the winner's saved address, D-056; winner's bank reveal on hold, D-044) | US-050, US-051 |
| Winner doesn't pay (second bidder off-platform, D-026) | US-058, US-059 |
| Strikes (incl. ban check on join and bid, D-047; suspended farm finishes sold lots, D-054) | US-059, US-052 |
| Delivery (shipping to the winner's saved address, D-056; never marked delivered → stays `shipped`, D-053) | US-030, US-052, US-053 |
| Dead-on-arrival claims (on-site notices D-025, auto-confirm D-027) | US-054, US-055, US-056, US-061 |
| Cancellations (farmer before start, admin once live, D-022, D-031, D-034, D-035; a cancelled lot stays public as "Dibatalkan", D-050) | US-060, US-091, US-040 |
| Key flows: approve auction (D-033) | US-031, US-032 |
| Key flows: place bid | US-042, US-043 |
| Key flows: close lots (a job every minute; winner and price saved at close) | US-050 |
| Open questions: owner actions (Qontak quote, Meta verification, D-029) | US-080 (T-080.2, T-080.5) |
| Ratings | US-057 |
| WhatsApp bot | US-080 – US-085 |
| Technical approach: frontends, shared UI | US-001, US-003 |
| Key flows: live updates, live room | US-045, US-046 |
| Build milestones 1–8 | Epics 0–8 |
| Design rules: user-facing error messages Indonesian, from the backend (D-055) | US-042 (follow-up), US-031, US-041; every new task via the task-brief checklist |

## Out of scope for the MVP (from the plan)

Don't build these, and reject stories that need them: online payment gateway,
refunds (except when a farmer or an admin cancels an auction, D-034), fixed-price marketplace and cart checkout,
payment held by the platform, proxy bidding, buy-it-now, live video hosting,
withdrawals or transfers of credit.

## Open questions

The plan doesn't answer these. Each one needs an owner decision before its story
is built. Record the answer here, in `plan.md`, and as a decision in `docs/product/decisions.md`.

| ID | Question | Blocks |
|---|---|---|
| mvp-Q1 | **Answered 2026-11-14 (D-008):** yes, the registration phone is the WhatsApp number, and it's required. *(Was: is the registration phone the bot's WhatsApp number, and is it required?)* | none (was US-002, US-080) |
| mvp-Q2 | **Answered 2026-11-14 (D-009):** an admin setting. *(Was: env var, admin setting or constant?)* | none (was US-011) |
| mvp-Q3 | **Answered 2026-11-14 (D-010):** a settings table. *(Was: settings table, or env/config?)* | none (was US-015) |
| mvp-Q4 | **Answered 2026-11-15 (D-020):** charged when the admin approves, at the final fee; balance checked at submission (refused if short) and again at approval (fails if short). *(Was: is the listing fee charged at creation (draft) or at submission for approval? The plan says "creating one".)* | none (was US-031) |
| mvp-Q5 | **Answered 2026-11-15 (D-020):** moot; nothing is charged before approval, so no refund is ever needed. The refund rule doesn't change. *(Was: if admin rejects an auction, or lowers its fee at approval after the listing fee was charged, is the difference refunded?)* | none (was US-031, US-032) |
| mvp-Q6 | **Answered 2026-11-15 (D-023):** the first bid may equal OB; every later bid ≥ current + KB. *(Was: can the first bid equal OB, or must it be OB + KB?)* | none (was US-042) |
| mvp-Q7 | **Answered 2026-11-15 (D-025):** on-site only (Farmer area and admin-koi queue). WhatsApp claim template is a later idea (`docs/releases/README.md`). *(Was: WhatsApp, on-site only, or both?)* | none (was US-054) |
| mvp-Q8 | **Answered 2026-11-15 (D-026):** fully off-platform; the farmer reports non-payment; the lot is never reassigned. *(Was: does the platform record the second-bidder offer at all?)* | none (was US-058) |
| mvp-Q9 | **Answered 2026-11-15 (D-022):** a farmer may cancel only before the start (`draft` or `scheduled`); once `live`, only the admin. Join-fee refunds on farmer cancel stay; listing fee not refunded. *(Was: can a farmer cancel after bidding has started?)* | none (was US-060) |
| mvp-Q10 | **Answered 2026-11-15 (D-028):** per-farmer bidder table (bidder, bid count, lots bid on, wins, unpaid wins); flag at ≥50% of bids on one farmer or ≥2 unpaid wins from that farmer; no automatic action. *(Was: fields and thresholds?)* | none (was US-071; now blocked by mvp-Q22) |
| mvp-Q11 | **Answered 2026-11-15 (D-024):** bid marked removed, never deleted; price back to highest remaining bid or OB; extend stays. *(Was: how is the price restored, does extend still apply?)* | none (was US-072; now blocked by mvp-Q21) |
| mvp-Q12 | **Answered in part 2026-11-15 (D-029):** stays with Qontak (not Meta Cloud API direct). **Remaining:** the owner's written Qontak quote (price, Bot + User tokens, webhook access, webhook retry/signature, rate limits, utility charging inside the window, onboarding time), tracked as T-080.5. Owner also starts Meta Business verification now (T-080.2). *(Earlier: capability confirmed by T-080.1 research, 2026-11-14.)* | US-080 – US-085 |
| mvp-Q13 | **Answered 2026-11-15 (D-021):** option (b); rejection returns the auction to `draft` with a written reason the farmer sees; no new status. *(Was: add `rejected`, back to `draft`, or `cancelled`?)* | none (was US-032, US-033; see mvp-Q17) |
| mvp-Q14 | **Answered 2026-11-15 (D-027):** enum approved as proposed; closed = `confirmed` or `rejected`; new rule: auto-confirm 3 days after `resolved` by the existing scheduled job. *(Was: what are the claim statuses, and which count as closed?)* | none (was US-054, US-055, US-056, US-061) |
| mvp-Q15 | **Answered 2026-11-14, verified at runtime in US-031** (`farmer-auctions.spec.ts:496`): option (a); the member token's `app_metadata` contains `customer_id`. *(Was: how does the listing-fee charge find the farmer's **customer** wallet? Wallets link to customers (`plan.md`, Custom modules), but farmer routes use a member token plus `x-seller-id` (D-003), and D-003 forbids a custom customer↔seller link. Options: (a) read `customer_id` from the shared auth identity's `app_metadata` (D-003 says it holds both ids; whether a member token exposes it is not verified); (b) the create-auction call also sends the farmer's customer token; (c) charge on a separate step from the storefront under the customer token.)* | none (was US-031) |
| mvp-Q16 | **Answered 2026-11-15 (D-030, supersedes D-003's re-login bullet):** proposed text approved. *(Was: D-003 says re-login "after admin approves", but the code needs it right after registration.)* | none |
| mvp-Q17 | **Answered 2026-11-15 (D-031):** add `pending_approval`: `draft → pending_approval → scheduled → live → closed \| cancelled`. Submit moves `draft → pending_approval` (with the D-020 check); rejection moves `pending_approval → draft` with a reason; the queue filters on `pending_approval`; farmer cancel also allowed there. Supersedes D-021. *(Was: no state for "submitted, awaiting approval".)* | none (was US-031, US-032) |
| mvp-Q18 | **Answered 2026-11-15 (D-032):** fees recomputed at every submit (category's current fee × lots); an admin override is cleared on rejection and reapplied at approval if wanted. *(Was: which fees apply on resubmission, does an override survive rejection?)* | none (was US-031, US-032) |
| mvp-Q19 | **Answered 2026-11-15 (D-034):** option (a); an admin cancel refunds every participant's join fee, like a farmer cancel; listing fee not refunded. Refund rule and out-of-scope line widened. *(Was: what does an admin cancel refund?)* | none (was US-091) |
| mvp-Q20 | **Answered 2026-11-15 (D-035):** option (a); lot `open → cancelled`, admin only, reason saved, no winner. *(Was: no status for a cancelled lot.)* | none (was US-091) |
| mvp-Q21 | **Answered 2026-11-15 (D-036):** (1) option (a), only while the lot is `open`; after close, the fix is a lot cancel. (2) option (a), once every bid is removed, the next may equal OB. *(Was: removal after close; OB rule after removals.)* | none (was US-072) |
| mvp-Q22 | **Answered 2026-11-15 (D-037):** option (b), a farmer's non-payment report (US-058); counts cover all time. *(Was: what is an unpaid win, which period?)* | none (was US-071) |
| mvp-Q23 | **Answered 2026-11-15 (D-038):** farmer accept moves the claim straight to `approved`; `accepted` dropped from the enum; admin decides only disputes; 3-day clock starts at `approved` on both paths. *(Was: does an accepted claim need admin approval, when does the clock start?)* | none (was US-055, US-056) |
| mvp-Q24 | **Answered 2026-11-15 (D-033):** option (a); the payer's `customer_id` (from the member token, mvp-Q15) is saved on the auction at submit; approval charges that wallet. A field on the auction, not a customer↔seller link; D-003 holds. *(Was: how the admin-token approve step finds the farmer's wallet.)* | none (was US-031) |
| mvp-Q25 | **Answered 2026-11-15 (D-042):** admins see masked PII everywhere, admin-only routes and UI included; the full value only through an explicit reveal action logged with who, when, record and field. Covers KTP/NIK, bank account and phone. *(Was: how does an admin review PII that their screens now show masked? Options were (a) admins exempt, (b) masked plus a logged reveal, (c) masking only outside admin.)* | none (was US-021 AC1, US-092 T-092.2/T-092.5, US-070, US-091) |
| mvp-Q26 | **Answered 2026-11-15 (D-043):** column-level encryption for NIK, bank account and phone, on top of whole-disk/storage encryption; the existing wallet and top-up tables are included in US-092, not a follow-up; existing plain values are migrated by a one-off script that encrypts in place, verifies and leaves no plaintext. US-010 – US-015 stay `done`. *(Was: whole-disk, column-level, or both; do the wallet/top-up tables need it now, and do accepted stories need a follow-up?)* | none (was US-092; US-010 – US-013) |
| mvp-Q27 | **Answered 2026-11-15 (D-044):** the winner sees the farmer's full bank account, but only for the lot they won, through the same logged reveal as D-042. A narrow exception to D-039, coordinated with D-040. *(Was: full account to pay, or a masked account with another payment path?)* | none (was US-051) |
| mvp-Q28 | **Answered 2026-11-15 (D-046):** option (b); `scheduled`, `live` and `closed` are public; a closed lot shows final price and sold/unsold, never who won; the "Selesai" tab stays. *(Was: which auction statuses are public on `/lelang` and the lot pages? Options were (a) `scheduled` + `live`, (b) also `closed`, (c) (b) for N days.)* | none (was US-040) |
| mvp-Q29 | **Answered 2026-11-15 (D-047):** option (a); US-041 ships without a ban check; US-059 T-059.1 adds it to join and bid; the ban clauses of US-041 AC4 and US-042 AC1 are delivered and verified by US-059. *(Was: banned customers vs. join, before bans exist.)* | none (was US-041) |
| mvp-Q30 | **Answered 2026-11-15 (D-048):** option (a); joinable while the auction is `scheduled` or `live`, including while a lot runs past `end_at` on extends; any other status → 409 `auction_not_joinable`. *(Was: when does an auction "end" for joining?)* | none (was US-041) |
| mvp-Q31 | **Answered 2026-11-15 (D-049):** option (b); approval is refused when `start_at` is now or past (400 `start_passed`, nothing charged, stays `pending_approval`); the admin rejects it so the farmer picks new dates. Follow-up US-032 T-032.6, T-032.7. *(Was: approving an auction whose start time has already passed.)* | none |
| mvp-Q32 | **Answered 2026-11-15 (D-050):** option (b); a cancelled lot inside a public auction (`scheduled`, `live` or `closed`) stays visible on `/store/lots` and the lot page, labelled "Dibatalkan", with no price, no final price, no sold label, no winner and no bids. Delivered by US-040 T-040.1/2a/2b; US-091 only produces the cancelled lots. *(Was: is a cancelled lot (D-035) in a public auction shown or hidden?)* | none (was US-091) |
| mvp-Q33 | **Answered 2026-11-16 (D-051):** (1) option (b): first 3 letters of the first name + `***` + last 2 characters of the customer id, e.g. `Bud***x7`; no phone digits; full name and id never leave the server; same bidder, same mask within an auction. (2) option (c): full history with masked names on closed lots too; supersedes D-046 in part (top row shows the winner's masked name; no winner id or `winner_*` field). Unblocks US-044; US-040 unchanged. *(Was: (1) What is the masked bidder format? The plan's example `Bud***23` keeps 3 letters of the first name plus 2 trailing characters, but doesn't say what the `23` is. Options: (a) first 3 letters of the first name + `***` + last 2 digits of the phone (`Bud***23`; ties the mask to PII, D-039); (b) first 3 letters + `***` + last 2 characters of the customer id (stable, no PII); (c) existing `maskName` format `B*** S******` (already in `src/utils/mask.ts:27`, no suffix; two "Budi"s look alike); (d) per-auction bidder number, e.g. `Bidder #12` (no name at all). (2) On a **closed** lot, is the bid history shown? D-046 forbids naming the winner, masked included; the top row of a history is the winner. Options: (a) hide the history on closed lots, show only final price and sold/unsold; (b) show the history but without the bidder column; (c) show it in full (would override D-046).)* | US-044 |
| mvp-Q34 | **Answered 2026-11-16 (D-052):** no phone in the MVP, either way. The winner sees the farmer's bank account (full, through D-044's logged reveal) and nothing else; the farmer sees the winner's name; no `wa.me` link (it needs the full number). The farmer's reveal of the winner's phone (D-044 confirmation) is dropped (T-051.3b dropped). Unblocks US-051 and US-053 T-053.2. The holder-name part was not answered → `mvp-Q39`. *(Was: how does the winner see the farmer's WhatsApp number (US-051 AC1)? Options (a) full through the logged reveal, (b) masked with a server-side wa.me redirect, (c) none in the MVP; and does "full bank account" include the holder name?)* | none (was US-051, US-053 T-053.2) |
| mvp-Q35 | **Answered 2026-11-16 (D-053):** option (a), nothing in the MVP; the lot stays `shipped`; no job, no setting. "Auto-confirm delivery after N days" is kept in `docs/releases/README.md`, Ideas not yet planned. *(Was: does a lot the winner never marks delivered need anything?)* | none (was US-053) |
| mvp-Q36 | **Answered 2026-11-16 (D-054):** option (a), yes: a farm suspended after approval may still mark its already-sold lots paid and shipped; it can't create auctions or lots. The paid/shipped routes skip `validateSellerOpenStep` and check ownership + status not `terminated` (`SellerStatus.TERMINATED` exists in Mercur 2.3.7). *(Was: may a suspended farmer finish already-won lots?)* | none (was US-052 T-052.1) |
| mvp-Q37 | **Answered 2026-11-16 (D-056):** option (a) with a logged reveal. The farmer ships to the winner's **default shipping address** (`customer_address.is_default_shipping = true`, at most one per customer in Medusa 2.21.2). Sold-lot row shows it masked: **city + province only**; `address_1`, `address_2` and `postal_code` are not sent (the `mask.ts` helpers keep leading/trailing chars, which leaks the house number, so none is used). Full address only through the farmer's logged reveal for their own sold lot (`pii_reveal_audit`, `record_type` `lot`, `field` `shipping_address`, one row per reveal). No default address → "Alamat belum diisi", no reveal (404, no row), and the winner's won-lot page prompts to add one (`/akun/alamat`). Relaxes D-052 for the address only; **no phone either way stands** (the customer's or the address's phone is never selected). Adds T-051.5 and tasks in US-051/US-052. *(Was: how does the farmer get the winner's delivery address with no phone? Options (a) the winner's default Medusa address (masked? full? reveal?); (b) the winner types an address on the won lot; (c) off-platform only.)* | none (was US-090 pilot readiness; added T-051.5, T-051.1b, T-051.2b, T-052.2) |
| mvp-Q38 | **Open (2026-11-16, non-blocking; US-085 is already blocked by mvp-Q12).** The plan's WhatsApp **Win** message ("sends the farmer's WhatsApp and bank details", US-085 AC1) conflicts with D-052 (no farmer phone to the winner) and D-044 (the full bank account only through the logged reveal). Options: (a) the win message sends a link to `/akun/menang` and the 1×24 h deadline only; (b) it sends the full bank account, the message itself counting as a logged reveal; (c) it sends the masked account plus the link. Recommend (a). | US-085 |
| mvp-Q39 | **Answered 2026-11-16 (D-057):** option (b), and one reveal records both fields: the winner's reveal returns the full `account_number` **and** full `holder_name`, with **one** `pii_reveal_audit` row (`field: "bank_account"`, not one row per field). **On hold with D-044** (owner, 2026-11-16: no farmer contact for now): intended rule, not built. Updated now so it is ready if D-044 returns: US-051 AC3, T-051.3a (body enum `"bank_account"`, response `{ account_number, holder_name }`), T-051.2a. *(Was: does the reveal include the account-holder name? Options (a) number only; (b) number and holder name.)* | none (was US-051 T-051.3a; those tasks are parked, not blocked) |

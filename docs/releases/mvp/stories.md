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
- [ ] T-014.2 [backend] *(Superseded, moved to US-030 T-030.6)* Auctions store the fees they were created with (snapshot)
- [x] T-014.3 [admin] `/pengaturan/biaya` screen — `apps/admin-koi/src/components/FeeTable.tsx`, `src/lib/data/fee-categories.ts`
- **Accepted 2026-11-14 with AC3 carried forward.** AC3 and T-014.2/T-014.4 are not passed here: they need the auction table. US-030 AC7, T-030.6 and T-030.7 prove them, and US-030's qa must check them.
- [ ] T-014.4 [qa] *(Superseded, moved to US-030 T-030.7)* Editing a fee doesn't change an existing auction's fees

### US-015 Admin edits auction settings · `done (evidence: packages/api/integration-tests/http/admin-settings.spec.ts:84-217; apps/admin-koi/src/components/SettingsForm.tsx; qa PASS)`
As an **admin**, I want to change the platform limits so that rules can be tuned.
*(Plan: Structure, Extend, Dead-on-arrival claims, How credit moves 1)*
- AC1: Editable values: extend window (default 5 min), max lots per auction (20), auction length (1–7 days), claim window (4 h), platform bank account (D-009).
- AC2: *(Carried forward to US-030 AC6.)* An extend-window change applies only to auctions that haven't started. It needs the auction table, which US-030 builds; no auction exists yet, so this story can't prove it.
- AC3: Settings are stored in a settings table in the database, not in env vars or config. *(D-010, answers mvp-Q3)*
- [x] T-015.1 [backend] Settings table + `/admin` routes (D-010) — `src/modules/platform-settings/`, `src/api/admin/settings/route.ts`; `admin-settings.spec.ts:84-217`
- [x] T-015.2 [admin] Settings section in `/pengaturan/biaya`, including the platform bank account — `apps/admin-koi/src/components/SettingsForm.tsx`
- [ ] T-015.3 [qa] Live auctions keep their original extend window — superseded, moved to US-030 T-030.5, because it needs the auction table

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

**Release risk to US-030's qa — two accepted stories depend on it:**
US-015 AC2 (extend window) and US-014 AC3 (fee table) were accepted as `done`
with those criteria carried forward, because they need the auction table.
US-030 AC6/AC7 and T-030.5/T-030.6/T-030.7 are what close them (with US-031
T-031.1 for the fee recompute at submit, D-032). If US-030 ships
without storing the extend window and the fees on each auction, both those
acceptances are void and no further check will catch it.

### US-030 Farmer creates an auction · `todo`
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
- [ ] T-030.1 [backend] Auction module: `auction` (farmer, category, start, end, join fee, listing fee, delivery method, status enum `draft | pending_approval | scheduled | live | closed | cancelled` (D-031), payer `customer_id` (D-033), fee override with reason (D-032), rejection reason (D-031), extend window snapshot (US-015 AC2), fee snapshot (US-014 AC3)), `lot` (OB, KB, current price, end time, winner, final price, status enum incl. `cancelled` with cancel reason (D-035)). Links to seller and product
- [ ] T-030.2 [backend] Create-auction workflow that checks the limits from US-015, snapshots the current extend window and the category's fees onto the auction
- [ ] T-030.3 [storefront] Farmer area: create auction and add lots with photos
- [ ] T-030.4 [qa] Limits enforced on the server, not only in the form
- [ ] T-030.5 [qa] *(moved from T-015.3)* Changing the extend window doesn't change an existing auction's stored window
- [ ] T-030.6 [backend] *(moved from T-014.2)* Auctions store their listing and join fees (recomputed at submit in T-031.1, D-032)
- [ ] T-030.7 [qa] *(moved from T-014.4)* Editing a fee doesn't change a `scheduled` or later auction's fees

### US-031 Farmer submits an auction; listing fee charged at approval · `todo`
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
- [ ] T-031.1 [backend] Submit workflow (`draft → pending_approval`): recompute fees, save `customer_id`, balance check (AC1–AC4) + store/vendor route
- [ ] T-031.4 [backend] Balance re-check + `listing_fee` charge steps inside US-032's approve workflow, with compensation (AC5–AC7)
- [ ] T-031.2 [storefront] Submit action in the Farmer area; short-balance prompt that links to top-up
- [ ] T-031.5 [admin] Clear error in the `/lelang` queue when approval fails on a short balance
- [ ] T-031.3 [qa] A failure after the charge rolls it back; a short balance refuses submission and approval and writes nothing; resubmitting after a category or lot change recomputes the fees; the charge lands on the saved `customer_id`'s wallet; rejection and a lowered fee write no refund

### US-032 Admin approves or rejects auctions · `todo`
As an **admin**, I want to approve each auction before it's scheduled so that
category, photos and fees are checked. *(Plan: Structure, Fees; D-020, D-031, D-032)*
- AC1: The queue lists only `pending_approval` auctions, with category, lots with photos, and fees (D-031).
- AC2: Approving moves `pending_approval → scheduled` and charges the listing fee in the same workflow (US-031).
- AC3: Admin can override the listing or join fee for this one auction, with a saved written reason. The listing-fee charge uses the overridden fee (D-020).
- AC4: Rejecting needs a written reason. The auction moves `pending_approval → draft`, the farmer sees the reason, fixes it and resubmits. No rejected status (D-031).
- AC5: Rejecting clears any fee override. The admin applies it again at approval if it's still wanted (D-032).
- [ ] T-032.1 [backend] Approve workflow + fee override with a reason + `/admin` routes
- [ ] T-032.4 [backend] Reject workflow: saves the reason, clears the override, moves `pending_approval → draft` (D-031, D-032) + `/admin` route
- [ ] T-032.2 [admin] `/lelang` approval queue (filters on `pending_approval`) with approve, override and reject-with-reason
- [ ] T-032.5 [storefront] Farmer area: show the rejection reason on the draft and let the farmer edit and resubmit
- [ ] T-032.3 [qa] An override or a rejection without a reason is refused; a rejected auction is `draft` with the reason visible to its farmer and no override; a `draft` auction never shows in the queue; no status outside the plan's enum is written

### US-033 Auctions start and farmers track them · `todo`
As a **farmer**, I want to see my auctions and their status so that I know
what's live. *(Plan: Design rules, statuses)*
- AC1: Statuses follow `draft → pending_approval → scheduled → live → closed | cancelled`. A rejected auction returns `pending_approval → draft`; there is no rejected status (D-031).
- AC2: A scheduled auction becomes `live` at its start time automatically.
- [ ] T-033.1 [backend] Scheduled job moves `scheduled → live` (idempotent, batched, logs a summary)
- [ ] T-033.2 [storefront] Farmer area: my auctions list with status
- [ ] T-033.3 [qa] Job is safe to run twice

---

## Epic 4: Joining and bidding (Milestone 4)

### US-040 Customer browses real auctions · `todo`
As a **customer**, I want to browse live and upcoming auctions and their lots so
that I can choose what to bid on. *(Plan: Milestone 4)*
- AC1: `lelang` and lot pages show API data. The demo constants are removed.
- AC2: Each lot shows photos, OB, KB, current price and time left.
- [ ] T-040.1 [backend] Store routes: list auctions, auction detail with lots
- [ ] T-040.2 [storefront] `lib/data` + adapters, then replace `const/auctions.ts` wholesale
- [ ] T-040.3 [qa] No demo data left in auction views

### US-041 Customer joins an auction · `todo`
As a **customer**, I want to join an auction by paying the join fee once so that
I can bid on all its lots. *(Plan: Structure, Fair play, Strikes)*
- AC1: Join fee recorded as `join_fee` (−) once per auction. The participant is added in the same workflow.
- AC2: Short balance blocks joining with a "top up" prompt.
- AC3: Joining is allowed any time until the auction ends, including after bidding starts.
- AC4: A farmer can't join their own auction. A banned customer can't join.
- [ ] T-041.1 [backend] `auction_participant` model + join workflow (balance check, charge, participant)
- [ ] T-041.2 [storefront] Join button with the fee shown and a short-balance prompt
- [ ] T-041.3 [qa] Joining twice charges once; own-auction and banned users are blocked

### US-042 Customer places a bid on the website · `todo`
As a **joined customer**, I want to bid on a lot so that I can win it. *(Plan: Bidding, Pricing per lot; D-023)*
- AC1: Only joined customers can bid. Not the farmer, not banned users.
- AC2: The first bid on a lot may equal OB. Every later bid must be at least current price + KB. A lower bid is rejected with the minimum allowed amount (D-023). "First" means no bid that isn't removed: once every bid is removed, the next may equal OB again (D-036).
- AC3: The lot row is locked and the server's timestamp decides order. Of two equal bids, the first wins and the second is rejected with the new current price.
- AC4: Bids can't be retracted.
- AC5: Each bid saves bidder, amount, source (`web`) and time.
- [ ] T-042.1 [backend] `bid` model + place-bid workflow with row lock
- [ ] T-042.2 [backend] Store route `POST` bid, identity from `auth_context`
- [ ] T-042.3 [storefront] `BidTerminal` wired to the API, with rejection messages
- [ ] T-042.4 [qa] Concurrent equal bids: exactly one accepted
- [ ] T-042.5 [qa] First bid = OB accepted; first bid < OB rejected; a later bid < current + KB rejected

### US-043 Late bids extend the lot · `todo`
As a **bidder**, I want late bids to extend the lot so that nobody wins by sniping.
*(Plan: Extend)*
- AC1: A bid in the last 5 minutes (the setting) moves that lot's end time to 5 minutes after the bid.
- AC2: It repeats until 5 minutes pass with no bid.
- AC3: Each lot extends on its own. Other lots keep their end time.
- [ ] T-043.1 [backend] Extend step in the place-bid workflow
- [ ] T-043.2 [qa] Extend applies per lot and uses the auction's setting at its start

### US-044 Bidders are masked · `todo`
As a **customer**, I want other bidders shown masked so that identities stay private.
*(Plan: Bidding)*
- AC1: Public pages show bidders masked, for example `Bud***23`.
- AC2: Bid history shows masked name, amount and time.
- [ ] T-044.1 [backend] The store response returns only the masked name, never raw identity
- [ ] T-044.2 [storefront] `BidHistory` uses API data
- [ ] T-044.3 [qa] No unmasked identity in any store response

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

### US-050 Lots close automatically · `todo`
As the **platform**, I want lots closed when their time ends so that winners are
fixed. *(Plan: Closing and winners, Key flows)*
- AC1: A job every minute closes lots past their end time.
- AC2: Highest bid that isn't removed wins (`won`). No such bid gives `unsold`. A `cancelled` lot is never closed (D-035).
- AC3: Winner, final price and close time are saved on the lot, never recomputed from bids.
- [ ] T-050.1 [backend] Close-lots job running a close workflow (idempotent, batched)
- [ ] T-050.2 [backend] The auction becomes `closed` when all its lots are closed (`unsold`, `won` or later, or `cancelled`)
- [ ] T-050.3 [qa] Running the job twice changes nothing; an extended lot isn't closed early

### US-051 Winner and farmer see each other's contact details · `todo`
**Depends on:** US-092 (masking and the logged reveal).
As a **winner**, I want the farmer's WhatsApp and bank details so that I can pay
within 1×24 hours. *(Plan: Closing and winners)*
- AC1: Only the winner of that lot sees the farmer's WhatsApp and bank account, plus the 1×24 h deadline.
- AC2: The farmer sees only the winner's name and WhatsApp number; the number is masked by default (D-039), and the farmer reveals the full number for their own sold lot through the logged reveal (D-044 confirmation).
- AC3: The farmer's bank account is shown masked; the winner reveals the full account for their own winning lot only, through the logged reveal (D-044). Until the reveal, both sides see a mask.
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-044).
**PII (D-039, D-044):** the full bank number is a narrow exception for the winner's own lot, through the same logged reveal as the admin; the farmer's full view of the winner's phone comes the same way (D-044 confirmation, 2026-11-15). US-052's shipping flow uses this: the farmer ships the winner but keeps seeing the masked phone until this story's reveal exists.
- [ ] T-051.1 [backend] Store routes for won lots (winner) and sold lots (farmer), scoped by `auth_context`; masked by default, reveal scoped to the winner's own lot (bank) and the farmer's own lot (winner's phone)
- [ ] T-051.2 [storefront] Won lots under `akun`; sold lots in the Farmer area
- [ ] T-051.3 [backend] Reveal action writes an append-only audit entry (who, when, lot, field) (D-044)
- [ ] T-051.4 [qa] Other users get 403 or no data; the full account is reachable only for the winner's own lot; the winner's full phone only for the farmer's own lot; every reveal is audited

### US-052 Farmer marks paid and shipped · `todo`
**Depends on:** US-051 (the logged contact reveal used when shipping), US-092 (masking).
As a **farmer**, I want to mark a lot paid and then shipped so that progress is
tracked. *(Plan: Closing, Delivery)*
- AC1: `won → paid → shipped`, in order only.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC3: While shipping, the farmer sees the winner's phone **masked** (D-039); the full number comes only through US-051's logged reveal for the farmer's own sold lot.
- [ ] T-052.1 [backend] Status workflows + store routes (the farmer must own the lot)
- [ ] T-052.2 [storefront] Farmer area actions
- [ ] T-052.3 [qa] States can't be skipped; the farmer's phone view stays masked unless revealed through US-051, which is audited

### US-053 Winner marks delivered · `todo`
As a **winner**, I want to mark the fish delivered so that the sale completes and
the claim window starts. *(Plan: Delivery)*
- AC1: Only the winner can mark `shipped → delivered`.
- [ ] T-053.1 [backend] Delivered workflow + route
- [ ] T-053.2 [storefront] Button on the won lot

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

### US-056 Approved claims are resolved · `todo`
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

### US-058 Farmer reports a winner who didn't pay · `todo`
As a **farmer**, I want to report a winner who didn't pay within 1×24 h so that
admin can act. *(Plan: Winner doesn't pay; D-026)*
- AC1: The farmer can report after the deadline. The admin reviews it and may give a strike.
- AC2: Any offer to the second-highest bidder is fully off-platform. The platform records nothing about it and never reassigns the lot; winner and final price stay as saved at close (D-026).
- [ ] T-058.1 [backend] Report model/state + routes
- [ ] T-058.2 [storefront] Report button after the deadline
- [ ] T-058.3 [admin] Report review that leads to a strike

### US-059 Strikes and bans · `todo`
As an **admin**, I want to give strikes after checking a report so that repeat
offenders are banned. *(Plan: Strikes)*
- AC1: Admin gives each strike with a reason (winner: didn't pay; farmer: didn't ship a paid lot, or refused an approved claim).
- AC2: 2 active strikes = ban. A banned winner can't join or bid. A banned farmer can't create auctions.
- AC3: Strikes expire after 6 months. Admin can remove a strike with a reason.
- AC4: Every ban and every suspend needs a written reason, the same rule as a farm rejection (D-041). admin-koi refuses the action without one.
- [ ] T-059.1 [backend] `strike` model + give/remove workflows + an active-strike check used by join, bid and create; every suspend and ban passes `reason` (D-041)
- [ ] T-059.2 [admin] Strike actions on reports and users
- [ ] T-059.3 [qa] An expired strike no longer counts; the ban lifts when active strikes drop below 2

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
**PII (D-039, D-042):** bidder and participant details shown on the cancel and monitoring screens are masked, as on every admin route; the full value only through the logged reveal. US-092 delivers it.
- [ ] T-091.1 [backend] Cancel-lot and cancel-live-auction workflows + `/admin` routes (moved from T-072.1)
- [ ] T-091.2 [admin] Cancel actions with a required reason on the live monitoring screen
- [ ] T-091.3 [qa] A farmer can't reach either cancel; a cancelled lot has no winner and is skipped by the close job; refunds total exactly the join fees collected; no `listing_fee` refund; statuses follow the plan's enums only

### US-092 Personal data is encrypted and masked · `todo`
As a **customer**, I want my personal data encrypted at rest and hidden behind
masks everywhere it is shown, so that a leak or a stolen screenshot exposes
little of it. *(Plan: Personal data protection; D-039, D-040, D-042, D-043, D-045)*
- AC1: NIK, bank account number and account-holder name, and phone are encrypted at **column level**, on top of the database's disk encryption; a direct database read shows ciphertext, not the value (D-043). **Not built yet.**
- AC2: The existing wallet and top-up tables are covered in the same story; their plain values are migrated by a one-off script that encrypts in place, verifies, and leaves no plaintext copy (D-043). **Not built yet.**
- AC3: No API result returns a full PII value to any client except the owner's own record; `/admin/*` included, admins get the mask. Each returns a masked form (a short prefix/suffix or last-4, the rest hidden) or nothing. The KTP photo is only ever a private file, never a URL. Self-view is the only unmasked path and is limited to the owner's own phone and own bank details on `/store/customers/me` and the farmer's own `/vendor/sellers*` record (D-045).
- AC4: Every screen in `apps/storefront-koi` and `apps/admin-koi` renders the masked value only, except the owner's own full value on their own account and farm-registration screens (D-045); no page source or client payload holds another person's full value. Admins are not exempt (D-042).
- AC5: A full value of someone else's PII is reachable only through an explicit reveal route. It is **required**, not optional, and records who, when, which record and which field in an append-only audit table (D-042). Its only callers are an admin reveal and a winner's reveal of their own won lot's bank account (D-044) and, for the farmer, the winner's phone on their own sold lot (US-051).
- AC6: Encryption keys come from the environment, not the database or the repo; `.env.template` gets a placeholder (root `CLAUDE.md` §11).
- AC7: `/admin/sellers*` responses do not return unmasked `payout_account.data`, because that free-form JSON can hold a bank number or a phone; it is masked like the other PII fields. `professional_details` (`corporate_name`, `registration_number`, `tax_id`) stays unmasked deliberately — out of scope unless the owner says otherwise.
**Status note:** masking is the part that lands here; column-level encryption (AC1, AC2; T-092.1, T-092.6) is **still not built**. Don't read this story as complete while encryption is missing. Still open as of US-021 acceptance (2026-11-15): T-092.1/T-092.6 column encryption, and T-092.9 `/admin/sellers*` `payout_account.data` masking.
- [ ] T-092.1 [backend] Column-level encryption for the PII fields — NIK, bank account number and account-holder name, phone — on the seller/custom-field, wallet and top-up tables; encrypt on write, decrypt only inside the server (D-043) — **open**
- [ ] T-092.2 [backend] Masking in every API result that carries PII: `/store/*`, `/vendor/*`, `/admin/*`; admins get the mask too (D-042); owner's own record is the only unmasked result (D-045)
- [ ] T-092.3 [admin] Masked rendering on every admin-koi screen that shows PII (`/kebun`, `/pengguna`, `/saldo/*`, live monitoring, cancel), plus the reveal button wired to the audit-logged route
- [ ] T-092.4 [storefront] Account screen (`/store/customers/me`) and farm-registration screen show the owner's own full phone and own bank details (self-view, D-045); any PII about someone else shown on storefront screens stays masked, e.g. the won-lot screens in US-051
- [ ] T-092.5 [backend] Reveal route (`/admin/*` and the winner's own-lot route) writing an append-only audit entry (who, when, record, field) (D-042, D-044)
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
- AC1: The winner gets the farmer's WhatsApp and bank details and the 1×24 h deadline.
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
| Personal data protection (column encryption on top of disk; masked everywhere incl. admin; logged reveal; self-view; D-039, D-042, D-043, D-044, D-045) | US-092, US-020, US-021, US-010 – US-013, US-051, US-052, US-057, US-070, US-091 |
| Orphan upload cleanup (owner follow-up) | US-093 |
| Becoming a farmer | US-020, US-021 |
| Store credit wallet: how credit moves (4 join, 5 submit/approve, D-020, D-031–D-033) | US-010, US-011, US-012, US-015, US-031, US-032, US-041 |
| Transaction types (`manual_topup`, `join_fee`, `listing_fee`, `adjustment`, `refund`) | US-012, US-041, US-031, US-013, US-060, US-091 |
| Wallet rules (integer, append-only, closed loop) | Epic 1 rules, US-010, US-013 |
| Refunds in the MVP (farmer or admin cancel, D-034; none on rejection or lowered fee, D-020) | US-060, US-091, US-031 |
| Fees and fee table (recomputed at submit, override cleared on rejection, D-032) | US-014, US-030, US-031, US-032, US-041 |
| Lot lifecycle and statuses (incl. `cancelled`, D-035) | US-033, US-050, US-052, US-053, US-054, US-091 |
| Auction statuses (`pending_approval`, rejection back to `draft`, D-031) | US-030, US-031, US-032, US-033, US-060 |
| Claim statuses (D-027, D-038) | US-054, US-055, US-056, US-061 |
| Structure (20 lots, 1–7 days, approval, rejection) | US-015, US-030, US-032 |
| Pricing per lot (OB, KB, first bid = OB, D-023) | US-030, US-042 |
| Bidding (incl. bid removal, D-024, D-036) | US-042, US-044, US-072 |
| Extend (anti-sniping) | US-043, US-015 |
| Fair play (incl. shill-bidding table, D-028, D-037) | US-041, US-042, US-071 |
| Closing and winners | US-050, US-051 |
| Winner doesn't pay (second bidder off-platform, D-026) | US-058, US-059 |
| Strikes | US-059 |
| Delivery | US-030, US-052, US-053 |
| Dead-on-arrival claims (on-site notices D-025, auto-confirm D-027) | US-054, US-055, US-056, US-061 |
| Cancellations (farmer before start, admin once live, D-022, D-031, D-034, D-035) | US-060, US-091 |
| Key flows: approve auction (D-033) | US-031, US-032 |
| Key flows: place bid | US-042, US-043 |
| Open questions: owner actions (Qontak quote, Meta verification, D-029) | US-080 (T-080.2, T-080.5) |
| Ratings | US-057 |
| WhatsApp bot | US-080 – US-085 |
| Technical approach: frontends, shared UI | US-001, US-003 |
| Key flows: live updates, live room | US-045, US-046 |
| Build milestones 1–8 | Epics 0–8 |

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
| mvp-Q15 | **Answered 2026-11-14 from a code reading, pending runtime verification in US-031:** option (a); the member token's `app_metadata` contains `customer_id`. *(Was: how does the listing-fee charge find the farmer's **customer** wallet? Wallets link to customers (`plan.md`, Custom modules), but farmer routes use a member token plus `x-seller-id` (D-003), and D-003 forbids a custom customer↔seller link. Options: (a) read `customer_id` from the shared auth identity's `app_metadata` (D-003 says it holds both ids; whether a member token exposes it is not verified); (b) the create-auction call also sends the farmer's customer token; (c) charge on a separate step from the storefront under the customer token.)* | none (was US-031) |
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

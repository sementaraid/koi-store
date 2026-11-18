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

## Status as of 2026-11-18

**Last accepted stories:** US-051 and US-052 (Epic 5), qa PASS on every AC,
accepted 2026-11-18 after D-058/D-059 re-opened them. Before them: US-055
(Epic 5), qa PASS on AC1–AC2, accepted
2026-11-17, plus the unplanned `@koi/ui` tab-orientation fix. Before it: US-054
(Epic 5), qa PASS on AC1–AC4, fix round 1; US-045 (Epic 4), qa PASS fix round 1; US-044
(Epic 4), qa PASS on both ACs; US-051, US-052 (the shipped half only, both
re-opened for the bank-reveal and paid halves and accepted again 2026-11-18,
see below), US-053 (Epic 5),
qa PASS on every in-scope AC, fix round 1, accepted 2026-11-17. Before them:
US-043, US-050, then US-040, US-041, US-042 (Epic 4). T-030.8, T-032.6, T-032.7
and T-020.10 (seed fix) were accepted earlier. The `bid` model and the bid/join
code are committed (`d67d3c8`).

**Counts** (computed from this file, 2026-11-18; D-058/D-059/D-060/D-061 in force):

| Epic | Stories done | In progress | Todo | Parked | Blocked | Tasks done | Tasks open | Tasks parked |
|---|---|---|---|---|---|---|---|---|
| 0 Foundations | 3 | 0 | 0 | 0 | 0 | 9 | 0 | 0 |
| 1 Wallet | 6 | 0 | 0 | 0 | 0 | 22 | 0 | 0 |
| 2 Becoming a farmer | 2 | 0 | 0 | 0 | 0 | 11 | 5 | 0 |
| 3 Auctions for farmers | 4 | 0 | 0 | 0 | 0 | 23 | 0 | 0 |
| 4 Joining and bidding | 6 | 0 | 1 | 0 | 0 | 22 | 5 | 0 |
| 5 Closing and after-sale | 6 | 0 | 6 | 0 | 0 | 32 | 18 | 0 |
| 6 Admin operations | 0 | 0 | 6 | 0 | 0 | 0 | 22 | 0 |
| 7 WhatsApp bot | 0 | 0 | 0 | 0 | 6 | 0 | 12 | 0 |
| 8 Pilot | 0 | 0 | 1 | 0 | 0 | 0 | 5 | 0 |
| Unplanned | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| **Total** | **28** | **0** | **14** | **0** | **6** | **120** | **67** | **0** |

Stories: 28 done of 48 (58%), 14 todo, 6 blocked, none parked.
Tasks: 120 done of 187 active (64%), 67 open, none parked.

**Payment model decided (2026-11-17, D-058).** The MVP pays off-platform: the
winner pays the farmer directly within 1×24 h, the farmer marks the lot paid
(`won → paid`) and then ships; the platform holds and pays out no money. No
wallet debit, no ledger type, no payout balance. Xendit escrow stays the planned
beta direction, out of MVP scope. D-059 brings D-044 and D-057 back: the winner
reveals the farmer's full account number and holder name on their own won lot,
one logged reveal, no phone (D-052 stands).

**Unparked on 2026-11-17:** US-056 and US-058 back to `todo`; T-052.4,
T-051.1a, T-051.3a, T-051.2a back to `[ ]`; US-059's "winner didn't pay" strike
part back in scope. **US-051 and US-052 are `done` again (2026-11-18):** the
bank reveal (T-051.1a/.3a/.2a) and AC1's `won → paid` (T-052.4) landed and qa
reported PASS on every AC, so T-052.2, T-052.3 and T-051.4 close with them.
US-046's readiness no longer waits on an owner answer: D-061 settles
`mvp-Q43`.

**Wording fix (2026-11-18):** D-059 said the account "is never in a list
response, never masked-and-partially-shown", which contradicted US-051 AC3's
required mask on the winner's row. The decision now reads "a list or detail
response carries at most a mask (last 4), never the full number", with a
correction note. No rule changed: the mask on the row and the logged reveal
were already what the story required.

**Blocked by a question: none new.** US-080 – US-085 stay blocked (mvp-Q12).

**Docs out of date (owner edit needed, not edited here):**
- `apps/storefront-koi/CLAUDE.md:97-98` still says the farmer's WhatsApp and
  bank details are shown to the winner and the farmer sees the winner's
  WhatsApp. It contradicts D-052 (no phone either way), D-059 (winner sees the
  bank account, logged reveal) and D-056.
- `plan.md:11` still says how the winner pays the farmer "is open". D-058
  answers it. The plan is approved, so only the owner edits it.
- `docs/releases/README.md:32` still calls escrow the planned direction for the
  MVP stories; D-058 keeps it for beta only.

**Next in milestone order:**
1. **US-058** (report a non-paying winner; deadline `closed_at` + 24 h, now
   live on the winner's row) then **US-056** (claim resolution, direct refund
   off-platform); then US-057, US-059, US-060, US-061. The paid loop (US-051's
   bank reveal, US-052 T-052.4) is built, so both are unblocked.
2. Small backend swap in the same window: **US-055 T-055.5** (D-060), one guard
   change in two workflows and one spec case.
3. **US-046** is fully ready: its live-link read/write is independent of money,
   and D-061 removed its owner question.
   Order when picked: T-046.1 → T-046.2 ‖ T-046.3 ‖ T-046.5 → T-046.4.
US-051, US-052, US-053, US-054, US-055 remain `done`. T-020.10 can run any
time; qa's admin browser checks need it.

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

### US-044 Bidders are masked · `done (evidence: packages/api/integration-tests/http/store-lots.spec.ts:476-655 (14/14, 7 new cases at :476,:523,:552,:577,:589,:612); packages/api/src/utils/mask.ts:36-42; packages/api/src/utils/__tests__/mask.unit.spec.ts:40-52; packages/api/src/api/store/lots/route.ts:66-72,117,138,204-235; packages/api/src/api/store/lots/[id]/route.ts:40-51; apps/storefront-koi/src/lib/data/lots.ts:35,38; apps/storefront-koi/src/lib/adapters/lot.ts:56-62; LotPage.tsx:278-291; bun run test:unit 17/17; storefront bun run check 187/187; render check /lelang open signed out + as budi, closed won, no-bid, cancelled — 5 routes 200, 0 issues; qa PASS)`
As a **customer**, I want other bidders shown masked so that identities stay private.
*(Plan: Bidding)*
- AC1: Public pages and `/store/*` routes show every bidder as the first 3 letters of their first name + `***` + the
  last 2 characters of their customer id, for example `Bud***x7` (D-051). No phone digits; the full name and the
  customer id never appear in any store response; the same bidder shows the same mask on every row of an auction.
- AC2: A lot's bid history shows masked bidder, amount and time, on open **and** closed lots (D-051). A closed lot
  still returns no winner id, name or `winner_*` field (D-046). A cancelled lot shows no bids (D-050).
- [x] T-044.1 [backend] The store response returns only the masked name, never raw identity
- [x] T-044.2 [storefront] `BidHistory` uses API data
- [x] T-044.3 [qa] No unmasked identity in any store response

**Acceptance (2026-11-17): accepted. qa PASS on AC1 and AC2.** Spot-checked: `maskBidder` first-name
`slice(0,3)` + `***` + lowercased `customerId.slice(-2)` (`src/utils/mask.ts:36-42`); `toStoreBids` one batched
`query.graph` on `customer` (fields `id`, `first_name` only), sort `created_at` DESC tie `id` DESC, three keys only
(`route.ts:204-235`); `bid_count` from `rows.length`, 0 when cancelled (`route.ts:117,138`);
feed never re-emits `bids` (`STORE_LOT_FIELDS` `route.ts:66-72`); detail forces `bids: []` on a cancelled lot
(`[id]/route.ts:49`); storefront maps `bid_count`/`bids` and renders `bidder` verbatim (`lib/adapters/lot.ts:56-62`,
`LotPage.tsx:278-291`). Re-ran: `bun run test:unit` 17/17; `bun run test:integration:http -- store-lots` 14/14
(7 new cases at `:476,:523,:552,:577,:589,:612`, old 8 kept); storefront `bun run check` 187/187 + ESLint clean;
`packages/api` and `apps/admin-koi` `tsc` clean.
**Recorded:** the feed carries `bid_count` with no `bids` key; the mask is derived at read time from the customer's
current `first_name` + id, nothing stored (`mask.ts:32-35` comment). mvp-Q40 stays **open, non-blocking**;
recommendation (a) accept the derived mask.
**Citation slips (not AC failures):** qa cited unit cases at `:40-52` (they are `:40-52`, `// US-044` at `:39`) and the
mask at `route.ts:206-239` (helper is `:204-235`); both ranges overlap and the substance matches.

**Readiness (2026-11-17): built and accepted (was `todo`).** mvp-Q33 answered (D-051): format `Bud***x7`;
full masked history on open and closed lots, which supersedes D-046 in part (the top row of a closed lot shows the
winner's masked name; nothing else about the winner is exposed). No decision newer than D-051 (D-052–D-057) changes
this story. Prerequisites are met: US-042 T-042.1 (the `bid` table) and US-040 T-040.1 (`GET /store/lots(/:id)`) are
both committed (`d67d3c8`).
**US-040 unchanged:** `GET /store/lots` and `/store/lots/:id` today return no bids and no winner field
(`STORE_LOT_FIELDS`, `packages/api/src/api/store/lots/route.ts:56`). Bid history is this story's job; US-040's ACs,
tasks and qa brief stay as written.

#### Briefs

**Refreshed 2026-11-17 (step 1).** Ready, not blocked. US-040 and US-042 are committed (`d67d3c8`), so the `bid`
table and `GET /store/lots(/:id)` exist today. No decision newer than D-051 (D-052 to D-057) changes this story;
mvp-Q33 stays answered. Endpoint inventory: every route these screens read exists today; the only missing pieces are
two response fields, added by T-044.1, which is ordered first. T-044.1 is read-only (no workflow, no migration) and
leaves the bid workflow alone.
Cross-cutting items that apply: D-039/D-042/D-045 (masking, admins not exempt, no self-view on a public route),
D-055 (Indonesian copy), `codegen`, `tsc` in both Koi apps.

```text
Story: US-044 (task T-044.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: nothing (US-040 and US-042 are committed; D-051 answered).

## Acceptance criteria (verbatim)
- AC1: Public pages and `/store/*` routes show every bidder as the first 3 letters of their first name + `***` + the
  last 2 characters of their customer id, for example `Bud***x7` (D-051). No phone digits; the full name and the
  customer id never appear in any store response; the same bidder shows the same mask on every row of an auction.
- AC2: A lot's bid history shows masked bidder, amount and time, on open **and** closed lots (D-051). A closed lot
  still returns no winner id, name or `winner_*` field (D-046). A cancelled lot shows no bids (D-050).

## Decisions in force
- D-051: the mask is the first 3 letters of the first name + `***` + the last 2 characters of the customer id; no
  phone digits; full history on open and closed lots; supersedes D-046 in part.
- D-046 (rest): no winner id, name or any `winner_*` field on a public route, closed lot included.
- D-050: a cancelled lot shows no bids.
- D-039 / D-042 / D-045: no full PII of anyone else to anyone, admins included. D-045's self-view covers only the
  customer's own record (`/store/customers/me`) and the farmer's own `/vendor/sellers*`, so a bid row is masked for
  its own author too — no "Anda" branch in a store response.
- CLAUDE.md §9: reads go through `query.graph`; the customer is a soft reference, so read first names in one batched
  `query.graph` on `customer` (pattern: `src/api/vendor/sold-lots/route.ts:61-90`); no link, no service call.
- CLAUDE.md §8: whole-rupiah integers; no stored counters — `bid_count` is computed on every read.

## Endpoint inventory (all exist; only fields are new)
| Method | Path | Exists? | Change |
|---|---|---|---|
| GET | /store/lots | yes, `src/api/store/lots/route.ts` | + `bid_count` |
| GET | /store/lots/:id | yes, `src/api/store/lots/[id]/route.ts` | + `bid_count`, `bids` |
| POST | /store/bids | yes, `src/api/store/bids/route.ts` | unchanged |

## Response contract (pin this; T-044.2 consumes it)
GET /store/lots → 200
  { lots: [{ …current StoreLot fields…, bid_count: number }], count, limit, offset }   // no `bids` key
GET /store/lots/:id → 200
  { lot: { …current StoreLot fields…, bid_count: number,
           bids: [{ bidder: string, amount: number, created_at: string /* ISO */ }] } }
  - `bids` newest first (`created_at` DESC, tie `id` DESC); `amount` is whole rupiah, an integer.
  - each row has exactly those three keys: no bid id, no customer id, no name, phone or email.
  - no bids → `bids: []`, `bid_count: 0`. Cancelled lot → `bids: []`, `bid_count: 0` (D-050).
  - closed lot → full history, same shape; no `winner_*` key anywhere (D-046).

## Build
- `maskBidder(firstName: string | null | undefined, customerId: string)` in `src/utils/mask.ts`:
  - name part = the first 3 characters of the trimmed `first_name`; fewer than 3 → keep what there is, no padding
    (`Al` → `Al`); empty or missing → empty.
  - id part = the last 2 characters of `customerId`, lowercased. Never derived from PII.
  - result `${namePart}***${idPart}`: `Budi` + `cus_…S09X` → `Bud***9x`; blank name → `***9x`.
  - pure: no randomness, no per-request salt — the same inputs give the same mask on every row and every request.
  - derived at read time from the customer's current `first_name`; nothing is stored. Consequence: a customer who
    later edits their first name re-masks their own rows together at the next read (AC1's one-mask-per-bidder rule
    still holds within a response). Non-blocking; put to the owner with this brief (see the report).
- Add `bids.id`, `bids.customer_id`, `bids.amount`, `bids.created_at` to `STORE_LOT_FIELDS` (`route.ts:56`); strip
  them in the mapper so the feed sends no bid rows at all.
- `toStoreLot` (`route.ts:84`): set `bid_count` (row count; 0 when cancelled). Build `bids` **only** in the `[id]`
  handler: one batched `query.graph` (`entity: "customer"`, fields `id`, `first_name`, filters `id: ids`; no ids →
  no query) plus `maskBidder`. The customer row never leaves the server.
- Sort in JS: `created_at` DESC, tie `id` DESC. No cap and no pagination in the MVP; leave a comment naming the
  ceiling: add a limit plus `has_more` when a lot can carry hundreds of bids.
- Leave a comment at the bid mapper naming US-072 T-072.1: once `removed_at` exists, filter removed rows here.
- Cancelled: force `bids: []` and `bid_count: 0` in the mapper; the rows stay in the DB.
- Read-only: no new route, no workflow, no mutation, no migration. Run `bun run codegen`.

## Start from
- `src/api/store/lots/route.ts:56` (STORE_LOT_FIELDS), `:84-137` (toStoreLot), `:139-160` (toStoreLots batched
  read), `:162-184` (getPublicLots)
- `src/api/store/lots/[id]/route.ts` (the detail handler calling `getPublicLots`)
- `src/api/vendor/sold-lots/route.ts:61-90` (a batched `query.graph` on customer by id list)
- `src/utils/mask.ts`, `src/utils/__tests__/mask.unit.spec.ts` (helper and unit-spec style)

## Do not touch
- `apps/**`; `src/workflows/**`; `src/api/store/bids/**`; `src/modules/**`; migrations; the vendor routes

## Spec
- `src/utils/__tests__/mask.unit.spec.ts`: `Budi` + `cus_…9x` → `Bud***9x`; `Al` → `Al***9x`; null/blank → `***9x`;
  trimming; lowercased id part; two customers sharing a first name differ in the id part.
- `packages/api/integration-tests/http/store-lots.spec.ts` (extend the file; keep the 8 specs):
  - two customers (each with a `first_name`) bid on an open lot → the detail returns both bids, newest first,
    `bidder === maskBidder(first_name, id)`; one customer's two bids give the same string.
  - `JSON.stringify(body)` contains neither customer id, nor an email, phone, full first name or last name.
  - feed rows carry `bid_count` and no `bids` key; the detail's `bid_count` equals `bids.length`.
  - cancelled lot → `bids: []`, `bid_count: 0`, no bid data.
  - closed lot (status `won`) → full history, same masks; no `winner` substring (extend `:290`).
  - lot with no bids → `bids: []`, `bid_count: 0`.

## Cross-cutting checklist
- [ ] PII: no customer_id, email, phone or full name in either response (D-039, D-042, D-045)
- [ ] Rupiah integers, never floats; `bid_count` computed from rows, never stored (CLAUDE.md §8)
- [ ] Read-only: no workflow; no `validateSellerOpenStep` (no `/vendor/*` mutation)
- [ ] `bun run codegen` after the route types change
- [ ] no `req.seller_context` read → no seller-context type import
- [ ] D-055: no new user-facing message (the existing 404 is never shown verbatim)

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                        → clean
cd packages/api && bun run codegen                                → store lots response has bid_count/bids
cd packages/api && bun run test:unit                              → mask unit spec passes
cd packages/api && bun run test:integration:http -- store-lots    → old + new pass (run alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the final GET /store/lots(/:id) contract. Don't commit.

## Open questions
none blocking. mvp-Q40 (non-blocking, owner; asked in the step-1 report): a customer renaming themselves re-masks
their past bids at the next read. Options: (a) accept — a derived mask, all rows move together (this brief);
(b) snapshot the mask on the `bid` row at placement (new column + migration, stable forever).
```

```text
Story: US-044 (task T-044.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=30 min
Starts after: T-044.1 delivered the contract above (`codegen` run).

## Acceptance criteria (verbatim)
- AC1: Public pages and `/store/*` routes show every bidder as the first 3 letters of their first name + `***` + the
  last 2 characters of their customer id, for example `Bud***x7` (D-051). No phone digits; the full name and the
  customer id never appear in any store response; the same bidder shows the same mask on every row of an auction.
- AC2: A lot's bid history shows masked bidder, amount and time, on open **and** closed lots (D-051). A closed lot
  still returns no winner id, name or `winner_*` field (D-046). A cancelled lot shows no bids (D-050).

## Decisions in force
- D-051: render the API's mask exactly; the client never masks, re-masks or prettifies it.
- D-046 (rest): a closed lot shows the history but no "Pemenang" label and no winner styling. BidHistory's existing
  "Tertinggi" badge on the top row stays (highest bid, not a winner label; the masked top row is allowed, D-051).
- D-050: a cancelled lot shows no history at all.
- D-045: no self-view exception on a public page — the bidder's own row is masked like every other row.
- D-055: copy is Indonesian; this screen shows no backend message.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots/:id | yes; `bid_count` + `bids` added by T-044.1 | `{ lot: { …, bid_count, bids: [{ bidder, amount, created_at }] } }` |
| GET | /store/lots | yes; `bid_count` added by T-044.1 | `lots[].bid_count`; no `bids` key |
| GET | /store/auctions/:id/join | yes | join state (unchanged) |
| GET | /store/wallet | yes | balance (unchanged) |
| GET | /vendor/sellers (member) | yes | farm (unchanged) |
| GET | /store/won-lots/:id | yes | winner's own row (unchanged) |
| POST | /store/bids | yes | unchanged; not read by this task |
No missing route: T-044.1, ordered first, only adds fields.

## Build
1. `lib/data/lots.ts`: `StoreLot` gains `bid_count: number` and `bids?: { bidder: string; amount: number;
   created_at: string }[]` (present only on the detail fetch). Both fetchers stay as they are.
2. `lib/adapters/lot.ts` `toAuctionProduct`: `bidCount: lot.bid_count`; `bids: lot.bids?.map((b) => ({ bidder:
   b.bidder, amount: b.amount, at: b.created_at }))` — `undefined` when the key is absent, so feed rows stay
   bids-less. Delete the "US-044 owns bid counts" placeholder (`lot.ts:56-58`). Extend `lib/adapters/lot.test.ts`
   (`created_at` → `at`, `bid_count` → `bidCount`, absent `bids` → `undefined`).
   Intended side effect: the feed card tally (`AuctionProductCard.tsx:79-84`) and the lot page tally
   (`LotPage.tsx:199-204`) start rendering once `bid_count` exists.
3. Lot page history, `components/sections/LotDetailsPage/components/LotPage.tsx`: inside the existing `!cancelled`
   branch, after the OB/KB grid (`:250-267`) and before the won band (`:272`), add a section with the Indonesian
   heading `Riwayat bid` (copy already used at `LiveRoom.tsx:215`) and
   `<BidHistory bids={auction.bids} variant="inline" />`. Render the section only when `auction.bids?.length` —
   never pass `[]` (BidHistory's empty line claims the house published nothing, a different fact). A cancelled lot
   never reaches this branch (D-050); a closed lot does, with the same list.
4. Render `bidder` verbatim. No masking, no "Anda", no name joining. Amount and time stay BidHistory's job
   (`formatPrice`, `formatAgo`).

## Start from
- `lib/adapters/lot.ts:56-58` (the placeholder), `lib/adapters/lot.test.ts`
- `components/sections/LotDetailsPage/components/LotPage.tsx:250-280` (the insertion point)
- `components/molecules/BidHistory/BidHistory.tsx` (props `bids`, `variant="inline"`)

## Do not touch
- `packages/api/**`; `components/sections/LivePage/**`; `const/live.ts`; the BidHistory component; the PlaceBid
  prefill (its approved heuristic stays)

## Cross-cutting checklist
- [ ] PII: only the server's mask is rendered; no customer id, name, phone or email on the screen
- [ ] Indonesian copy; rupiah via `formatPrice` (`id-ID`)
- [ ] No new route, component, helper or dependency
- [ ] `bun run tsc` in both Koi apps (T-044.1 changed `packages/api/src`)
- [ ] UI task: run the render check on the changed route

## Definition of done
cd apps/storefront-koi && bun run check            → pass (tsc + node:test + lint)
cd apps/admin-koi && bun run tsc                   → clean
render-check skill on /lelang/<lot with bids> (signed out) → heading "Riwayat bid", masks in the `Bud***x7` shape,
rupiah amounts, no "undefined"/NaN, no hydration error; then one closed lot with bids.
If the dev DB has no lot with bids (`seed-koi.ts:62` seeds no auctions), say "browser NOT verified" with the reason
and paste the `curl` of `/store/lots/:id` showing the JSON.
Report: standard header + screenshot path(s). Don't commit.

## Open questions
none
```

```text
Story: US-044 (task T-044.3)   Release: mvp
Agent: qa   Expected: <=30 min

Verify AC1–AC2. Decisions: D-051, D-046 (rest), D-050, D-039, D-042, D-045 (scope), D-055.
Code under test: `packages/api/src/utils/mask.ts` (`maskBidder`), `src/api/store/lots/route.ts`,
`src/api/store/lots/[id]/route.ts`; `apps/storefront-koi` `lib/data/lots.ts`, `lib/adapters/lot.ts`, `LotPage.tsx`.
Commands (alone, nothing else on Jest): `cd packages/api && bun run test:unit`;
`cd packages/api && bun run test:integration:http -- store-lots`; `cd apps/storefront-koi && bun run check`;
`cd apps/admin-koi && bun run tsc`.

AC1 — read every store response that can carry a bid: `GET /store/lots`, `GET /store/lots/:id`, `POST /store/bids`.
None may hold another customer's `customer_id`, email, phone, first or last name. Every `bidder` matches
`/^.{0,3}\*\*\*[0-9a-z]{2}$/` and equals `maskBidder(first_name, customer_id)`; one customer, one string, per lot.
AC2 — open lot: masked bidder + amount + time, newest first. Closed lot: the same list and masks, and no
`winner_customer_id`, `winner_*` field or "Pemenang" text. Cancelled lot: no bids, `bid_count` 0.
Allowed, not a bug: the masked top row of a closed lot (D-051) and BidHistory's "Tertinggi" badge (highest bid,
not a winner label).

Watch for: a mask built from the phone or a full name; one customer masked two ways inside one lot; a raw id or name
on the page; a closed lot's history differing in format from an open lot's; bids on a cancelled lot; `bid_count`
disagreeing with the rendered rows; the storefront re-masking or prettifying the string; `bids` leaking on the feed;
`bid_count` stored or overwritten anywhere.

Browser: render-check `/lelang` and `/lelang/<lot with bids>` signed out, plus one closed lot with bids, and one lot
with no bids (no heading; BidHistory's "belum diterbitkan" empty line not shown).
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-045 Prices update live · `done (evidence: apps/storefront-koi/src/hooks/use-lot-poll.ts:26-99 (recursive setTimeout 36-38, pause on hidden tab / [data-bid-form] 43-50, 404 stop 56-60, closed/cancelled stop 67-70, silent backoff 73-77, visibility refetch 82-86, cleanup 91-95); src/lib/helpers/poll.ts:6,26-29 (LOT_POLL_MS=2000, 30 s cap) + poll.test.ts; LotPage.tsx:81,106; PlaceBid.tsx:77,124; BidHistory.tsx:63-68; grep WebSocket/EventSource clean; storefront bun run check tsc + 187/187 + lint clean; admin-koi tsc clean; live outbid 2516 ms POST→render no reload; 20 signed-out reloads 0 hydration errors; qa PASS fix round 1)`
As a **bidder**, I want the price and countdown to update without reloading so
that I see outbids quickly. *(Plan: Key flows: live updates)*
- AC1: The lot page polls every few seconds. No websockets or SSE in the MVP.
- [x] T-045.1 [storefront] Polling on the lot page and live room *(live room part moves to T-046.2 — see Readiness)*
- [x] T-045.2 [qa] An outbid appears within one polling interval

**Accepted 2026-11-17 (qa PASS, fix round 1).** AC1 checked against code: `use-lot-poll.ts:26-99` polls with a
recursive `setTimeout` at `LOT_POLL_MS` (`poll.ts:6`, 2000 ms); no WebSocket/EventSource/`setInterval` in the hook,
helper or `LotDetailsPage/**` (grep clean; the only `setInterval` is BidHistory's 60 s "lalu" clock, `BidHistory.tsx:66`,
not a poller). Live: siti's outbid rendered on budi's page in 2516 ms with no reload.
Fix round 1: bug 1 (stale own-bid price) fixed at `PlaceBid.tsx:77` (`Math.max(confirmed?.currentPrice ?? currentPrice,
currentPrice)`), live 3.150.000 → outbid 3.250.000 → hint Rp 3.350.000 → 201; typed value survived an outbid while
focused. Bug 2 (hydration diff on relative time) fixed at `BidHistory.tsx:63-68` (clock set after mount); 20 reloads,
0 hydration errors, no undefined/NaN.
Regression (qa): 0 polls while `[data-bid-form]` focused; cancelled lot 0 polls in 8 s; backoff 2031/4009/8008/16006 ms
with last price kept, no toast; BidHistory callers `LotDetailsSheet.tsx:147`, `LiveRoom.tsx:231`, `LotPage.tsx:289`
client-side; no new dependency.
**Not verified in the accepting round:**
- Hidden tab: simulated only (headless can't truly hide a tab): 0 requests in 7 s, refetch 6 ms after visible.
- Closed-lot stop: live in round 0 only (close job closed the lot mid-view, board → "Harga akhir / Terjual", 0 polls
  after); code `use-lot-poll.ts:67-70` unchanged since. Not re-run in fix round 1.
- 30 s backoff cap: unit test only (`poll.test.ts`), not observed live.
- Countdown following a server extend: code-read only (`LotPage.tsx:106` `shownEnd = bidEndTime ?? live?.endsAt ??
  auction.endsAt`); no extend triggered in qa.
- Live-room polling: out of this story; moved to US-046 T-046.2 (room is still demo data).
Interval: 2 s is a proposed default, not a decision; `mvp-Q41` stays open, non-blocking (change is one line, `poll.ts:6`).

**Readiness (2026-11-17): ready (`todo`), nothing blocks it. No backend task.**
- No WebSocket/SSE in MVP; the lot page polls (plan `plan.md:249`, owner decision in force). One read, one screen.
- Poll interval: **no decision or plan line records one.** This section uses **2 s** as the proposed default
  (flagged for the owner, see below). If the owner records a different value, change `LOT_POLL_MS` only.
- Every field polling needs exists today in `GET /store/lots/:id`:
  `current_price`, `bid_count`, `bids[]`, `end_time`, `sold`, `cancelled`, `auction.status`, `final_price`
  (`packages/api/src/api/store/lots/route.ts:17-64`, `[id]/route.ts:18-51`; US-040 + US-044 committed).
  `GET /store/lots` already exists too (not needed by this task). **No missing route or field → no backend task.**
- Live room is still demo data: `LiveRoomPage` reads `DEFAULT_AUCTION_LOTS` from `src/const/live.ts`
  (`components/sections/LivePage/components/LiveRoomPage.tsx:4,17-18`), so polling it now would poll nothing real.
  **T-045.1 is scoped to the lot page only; live-room polling belongs to US-046 T-046.2** (which replaces the const).
- US-044 T-044.2 (real `BidHistory` on the lot page) already sits in the working tree (`LotPage.tsx:275-286`
  renders `auction.bids`; `lib/adapters/lot.ts:57-62` maps them). T-045.1 starts once that task is accepted and
  must not touch `BidHistory/**` itself.
- Cross-cutting items in force for both briefs: D-055 (Indonesian copy, rupiah `id-ID`), no new dependency,
  `bun run tsc` in both Koi apps, render check with the playwright MCP.

```text
Story: US-045 (task T-045.1)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=30 min
Starts after: US-044 T-044.2 accepted (BidHistory on real data); no backend contract needed.

## Acceptance criteria (verbatim)
- AC1: The lot page polls every few seconds. No websockets or SSE in the MVP.

## Decisions in force
- No WebSocket, no SSE (plan `plan.md:249`; owner decision in force). Polling only.
- D-046 / D-050: a closed or cancelled lot stops polling; the closed view still shows final price / sold label, never a winner.
- D-051: bid history is the API's masked rows, unchanged by this task.
- D-055: no new user-visible message from polling (failures are silent, last good data stays); any copy added is Indonesian.
- CLAUDE.md: data only through `src/lib/data` server actions (never raw `fetch`, never `sdk` in a component); no new dependency.

Poll interval: 2 s. Define it once as `export const LOT_POLL_MS = 2000` in `src/lib/helpers/poll.ts` (so the test
imports it); do not scatter the number.

## Endpoint inventory (every row exists; nothing to build on the backend)
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots/:id | yes, `packages/api/src/api/store/lots/[id]/route.ts:18-51` | `{ lot: { current_price, bid_count, bids: [{bidder, amount, created_at}], end_time, sold, cancelled, final_price, auction: { status, … } } }` |
| GET | /store/lots | yes, `route.ts:241-256` | not read by this task |
| POST | /store/bids | yes, `src/api/store/bids/route.ts` | our own bid, unchanged; it already calls `router.refresh()` |
No "Exists? no" row. No `codegen` needed (no route change).

## Build (one surface: the lot page)
1. New `src/hooks/use-lot-poll.ts` (client hook), pattern from `src/hooks/use-countdown.ts:26-56`:
   - `useLotPoll(lotId, enabled)`; state starts `null`; on each tick call the existing server action `getLot(lotId)`
     (`src/lib/data/lots.ts:281-289`). Keep the last successful `StoreLot` in state.
   - `getLot` rethrows every non-404 failure (`lots.ts:285-288`) and returns `null` on 404, so the hook wraps the
     call in `try/catch`: any throw is the failure path below; a `null` means the lot left the public feed, so stop
     polling (`enabled`-style local flag) and keep the last good data.
   - Timer is a recursive `setTimeout`, never `setInterval`, so a failure can back off. First tick after
     `LOT_POLL_MS`, not immediately (the server already rendered fresh data).
   - One tick MUST skip the request when: `document.visibilityState !== "visible"`; `document.activeElement` is inside
     `[data-bid-form]` (the bid input is being used, so do not clobber it); or `enabled` is false.
   - On failure: keep the last good `StoreLot` (no error UI, no toast, no console noise) and back off
       2 → 4 → 8 → 16 → 30 s (cap), reset to `LOT_POLL_MS` on success. This is the "no polling storm" rule.
   - Listen to `visibilitychange` and refetch immediately when the tab becomes visible.
   - Clean up the timeout and the listener on unmount. No websockets, no SSE, no new dependency.
   - Extract the delay math as a pure `pollDelayMs(attempt)` in `src/lib/helpers/poll.ts` with a colocated
     `poll.test.ts` (`node:test`; helper imports use the `.ts` extension). Keep the hook thin.
2. `src/components/sections/LotDetailsPage/components/LotPage.tsx` (no `'use client'` of its own; it is inside the
   client boundary via `LotDossier.tsx:1` and already uses `useCountdown`, so hooks are allowed there):
   - `const polled = useLotPoll(lot.id, !cancelled && !closed)`; map it with the existing `toAuctionProduct`
     (`src/lib/adapters/lot.ts`, no change) and prefer its `currentBid`, `bidCount`, `bids`, `endsAt`, `status`,
     `sold` over the server props. `AuctionProduct` has no `cancelled`/`finalPrice` field: derive
     `cancelled` from `status === "cancelled"` and `closed` from `sold !== undefined`, as `LotPage.tsx:95-98` does.
     Everything static (listing, info, media) keeps the server props.
   - `shownEnd` stays `bidEndTime ?? endsAt`: the PlaceBid `onEndTime` value still wins; a polled `end_time` after
     an extend now also moves the countdown within one interval (reuse `useCountdown`, no new timer).
   - Render `<PlaceBid>` only when `bid && !closed && !cancelled`; when a poll flips the lot to sold, the control
     disappears and polling stops (`enabled` false).
   - Do NOT poll with `router.refresh()`: it re-renders server components and remounts the bid field mid-typing.
     Keep PlaceBid on its server-provided `bid` prop; only its `currentPrice` may advance from the polled value while
     the form is not focused (the hook already pauses while it is). The pause is required, not cosmetic: PlaceBid
     keys its `FormField` on `minimum` (`PlaceBid.tsx:136`), so a new price remounts the input and would wipe what
     the customer typed.
3. `PlaceBid.tsx`: add only `data-bid-form` to the existing `<form>` (`:115`) as the pause marker. Do not change its
   submit, toast or `router.refresh()` logic.
4. Live room: **do not touch** `LivePage/**` or `const/live.ts`; US-046 T-046.2 owns real data and its polling.

## Start from
- `src/hooks/use-countdown.ts:26-56` (effect + cleanup pattern)
- `src/lib/data/lots.ts:281-289` (`getLot`)
- `src/components/sections/LotDetailsPage/components/LotPage.tsx:91-98,239-248,322-326` (clock state, closed flag, bid slot)
- `src/lib/adapters/lot.ts` (`toAuctionProduct`, unchanged)
- `src/lib/helpers/*.test.ts` (node:test layout)

## Do not touch
- `packages/api/**`, `apps/admin-koi/**`, `LivePage/**`, `const/live.ts` (US-046), `BidHistory/**` (US-044),
  `PlaceBid` submit/toast logic, any helper or adapter outside `poll.ts`.

## Definition of done
cd apps/storefront-koi && bun run check                    -> pass (tsc + node:test incl. poll.test.ts + lint)
cd apps/admin-koi && bun run tsc                           -> clean
render-check skill with the playwright MCP on `/lelang/<lot with bids>` signed out:
  price, bid count and "Riwayat bid" render; no console error, no hydration warning, no "undefined"/NaN;
  screenshot path recorded.
Update proof: with the page open and a second seeded customer placing a bid (UI or `POST /store/bids`), the price and
  history change within one interval (~2 s, allow 4 s) with no page reload and without moving focus.
Paused proof: focus the amount field and type digits; an outbid from the other account must leave the typed value
  and focus intact (poll skipped while the form has focus).
Report: standard header + render check result + screenshot path. Don't commit.

## Open questions
none blocking. The 2 s interval is a proposed default, not a recorded decision; use it and report it.
```

```text
Story: US-045 (task T-045.2)   Release: mvp
Agent: qa   Expected: <=30 min
Verify AC1. Decisions: D-046, D-050, D-051, D-055; no WebSocket/SSE.
Code under test: `apps/storefront-koi/src/hooks/use-lot-poll.ts`, `src/lib/helpers/poll.ts` (+ `.test.ts`),
`components/sections/LotDetailsPage/components/{LotPage,PlaceBid}.tsx`, `src/lib/data/lots.ts`.
Commands (alone, nothing else on Jest): `cd apps/storefront-koi && bun run check`;
`cd apps/admin-koi && bun run tsc`. No backend spec: no file under `packages/api` changed.

Prove, with evidence:
1. Interval and update: open `/lelang/<open live lot the signed-in customer joined>` as a second seeded customer
   (`*@koi.dev` / `supersecret`; join via the page first if needed). Bid from the second account (UI or
   `POST /store/bids` with that account's cookie). The first page's price, bid count and history change within one
   interval: measure POST -> render, PASS at <= 2 s + one tick (allow 4 s); no reload.
2. Hidden tab: open a second tab and bring it to front so the lot tab is hidden. Observe via the playwright MCP
   network log that no `/store/lots/:id` request starts while hidden; returning to the tab fetches at once.
3. Closed lot: a lot whose `end_time` passes while the page is open (the close job runs every minute) must stop
   polling; the board switches to the final price / "Terjual" / "Tidak terjual" and the bid control disappears.
   If no lot can be made to close within the window, report this bullet "code-read only" with file:line and say why.
4. Mid-typing: focus the amount input, type digits, then outbid from the other account. Assert the typed value,
   selection and focus are unchanged, and no layout jump (same element positions).
5. No console errors, no hydration mismatch and no "undefined"/"NaN"/"[object Object]" in the page on the lot route.
6. Failures: stop the backend or block the request briefly; the page keeps its last price, shows no error toast,
   logs no unhandled rejection, and request spacing backs off (2 → 4 → 8 s observed) instead of one request per 2 s.

Watch for: `router.refresh()` used as the poller (remounts the field); `setInterval` with no cleanup, or a timer still
running after navigating away or after close/cancel; requests continuing while the tab is hidden; a new dependency
for polling; the history re-sorted or re-masked client-side; a polled price overriding the bidder's own just-placed
bid toast/confirmation; the countdown not following a server extend.

Report PASS/FAIL per AC with file:line and command output; bugs with repro and expected/actual.
Screenshots and page snapshots land in `.playwright-mcp/`. Don't change app code.
```

**Owner question raised by this section (in the questions table, open, non-blocking):** `mvp-Q41` — is 2 s the
polling interval for the MVP lot page, or another value (e.g. 3 s/5 s)? It blocks nothing; T-045.1 uses 2 s as a
named constant, so a change is one line. Recommend 2 s.

### US-046 Live bidding room · `todo`
As a **bidder**, I want a live screen with one lot at a time so that the auction
feels like a live event. *(Plan: Live room)*
- AC1: Shows one lot at a time: photo, current price, countdown, bid feed.
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built. The link is a plain nullable `auction.live_stream_url` column, written by the farmer through `POST /vendor/auctions/:id/live-link` in any status except `closed`/`cancelled`, writable from admin-koi too, and rendered as an outbound link only (no iframe, no embedded player; D-061).
- [ ] T-046.1 [backend] `auction.live_stream_url` plain nullable column + migration, `POST /vendor/auctions/:id/live-link`, `POST /admin/auctions/:id/live-link`, URL validation, public and vendor exposure, `codegen`
- [ ] T-046.2 [storefront] `live` page on real data, replacing `const/live.ts`, the link rendered as an outbound link (ordered after T-046.1)
- [ ] T-046.3 [storefront] Farmer area: set and clear the live link (ordered after T-046.1)
- [ ] T-046.5 [admin] admin-koi live-link write on the `/lelang` queue row (ordered after T-046.1)
- [ ] T-046.4 [qa] Both ACs in a browser, including a real polling update and the link rendering, plus the admin write

**Readiness (2026-11-17; updated after D-061): ready (`todo`).** `mvp-Q43` is
answered by D-061: a plain nullable `auction.live_stream_url` column (not a
custom field), farmer write through `POST /vendor/auctions/:id/live-link` in any
status except `closed`/`cancelled`, the same write in admin-koi (T-046.5),
rendered as an outbound link with no embed and no host check beyond the
YouTube/Instagram allow-list. `mvp-Q42` (explicit lot selection, option a) is a
built choice and stays non-blocking.
- Plan rule being built: `plan.md:250`. "No video system is built" + MVP out of scope "live video" (`plan.md:14`)
  mean the link is an **outbound link**, never an `<iframe>` embed (D-061).
- **Storage.** A nullable `live_stream_url` column on our own `auction` model (auction module), not a Mercur custom field:
  `customFields` in `medusa-config.ts:76-82` is configured for Mercur entities (`Seller`), and `auction` is a Medusa
  module model owned by us with its own migrations (`src/modules/auction/migrations/`). A column is one generated
  migration and is read by `query.graph` with no extra wiring; a custom field on our module is unverified in the docs.
- **Who writes it.** The farmer, through `POST /vendor/auctions/:id/live-link` (member token + `x-seller-id`, D-003).
  The admin writes the same field through `POST /admin/auctions/:id/live-link` (admin token, D-002/D-061). Both reuse
  one workflow; identity from `req.seller_context` / `req.auth_context`, never the body. admin-koi's only auction list
  today is the `/lelang` approval queue (US-032, `pending_approval` rows), so T-046.5 puts the control there; a wider
  admin auction list is a new screen no rule asks for.
- **When it may be written.** Any status except `closed` and `cancelled` (409 with an Indonesian message, D-061). The
  current draft-only `POST /vendor/auctions/:id` (`workflows/update-draft-auction.ts:32-87`) can't serve this: a live
  link is only useful once the auction is `scheduled` or `live`.
- **One lot at a time (AC1).** Today's `pickFeatured` (`const/live.ts:88-90`) already means explicit selection: `?lot=`
  wins, else the first lot of a `live` auction, else the first open one. T-046.2 keeps that and adds no auto-rotation
  or next-lot control. Rotation would be an addition the AC doesn't ask for; mvp-Q42 option (a) is what ships.
- **Bidding is not in this story.** AC1 lists photo, price, countdown, bid feed. Placing bids is US-042's job on the lot
  page; the room therefore renders the board read-only and links to the lot page. The room's current fake bid state
  (`LiveRoom.tsx:96-141`, `onBid` writing local price/count) is demo-only and must go: it would show bids that never
  happened.
- **Polling is US-045's, not a second poller.** The room consumes `useLotPoll(lotId, enabled)` (`src/hooks/use-lot-poll.ts:26`),
  which already returns the detail `StoreLot` (with `bids[]`, from `getLot`, `src/lib/data/lots.ts:281-289`). No new hook,
  no second interval: `LOT_POLL_MS` (`src/lib/helpers/poll.ts:6`) stays the single cadence. US-045's `[data-bid-form]`
  pause is inert in the room because the room has no bid form.
- **Every response field AC1 needs already exists** except the link: `current_price`, `bid_count`, `bids[]`, `end_time`,
  `sold`, `cancelled`, `auction.status`, `photos` (`src/api/store/lots/route.ts:17-47,66-72,98-152`; `[id]/route.ts:18-51`).
  T-046.1 adds `auction.live_stream_url`; it is the only missing route/field, so it is ordered first.
- **Demo data to delete.** `DEFAULT_AUCTION_LOTS` (`const/live.ts:111`), `bidsFor` (`:353`), `pickFeatured`'s demo docs
  (`:88`), `DEFAULT_BROADCAST_TICKER` (`:49`), `DEFAULT_LIVE_STATS` (`:54`, the "Rp 1,42 M / 18ms" claims are fabricated),
  `DEFAULT_BUY_NOW` (`:60`, buy-now is out of MVP scope). Keep `DEFAULT_LIVE_MEDIA` (`:32`) and `LIVE_TINT` (`:66`):
  `ProductPage.tsx:10,73` and `LiveBand.tsx:4,44` still import them, and neither is demo *auction* data.
- **Cross-cutting items in force:** D-051 (masked bidder rows, rendered verbatim), D-046 / D-050 (public statuses; a
  cancelled or closed lot draws no price/bids and stops polling), D-055 (Indonesian copy, rupiah `id-ID`), D-003 (member
  token + `x-seller-id`), `validateSellerOpenStep` on the custom `/vendor/*` mutation, `codegen` after the route change,
  `bun run tsc` in both Koi apps, render check with the playwright MCP.

#### Briefs

```text
Story: US-046 (task T-046.1)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria (verbatim)
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built.
  (This task: the storage, the farmer's write path, the admin write, the validation, and the field on the public, vendor and admin responses.)
  D-061 also adds the admin-koi write, `POST /admin/auctions/:id/live-link` (T-046.5 consumes it).

## Decisions in force
D-061: a plain nullable `auction.live_stream_url` column (not a Mercur custom field); writable in any status except
`closed`/`cancelled`; farmer writes through `/vendor/*`, admin through `/admin/*`; rendered as an outbound link only,
no embed, no host check beyond the YouTube/Instagram allow-list.
D-003: the farmer's route is `/vendor/*`, member token + `x-seller-id`; identity from `req.seller_context`, never the body.
D-002: the admin route is `/admin/*` for admin-koi; nothing changes in `apps/admin`.
D-055: every refusal shown to a user is Indonesian, from the backend, rupiah `id-ID`; apps key on `code`/status.
CLAUDE.md §8/§9: one mutation per step with compensation; a module is thin CRUD; routes only GET/POST/DELETE; no `any`.
Plan out of scope "live video": store a URL only. No download, proxy, embed code or host check beyond the link itself.

## Build
1. Column. `src/modules/auction/models/auction.ts`: add `live_stream_url: model.text().nullable()` to the `auction` model
   (after `rejection_reason`, :48). Generate the migration:
   `bun x medusa db:generate auction` with DATABASE_URL inline (CLAUDE.md, packages/api guide: `bunx` does not exist in
   the container, and the bare env URL lacks `sslmode`, so the CLI hangs). Then `bun x medusa db:migrate` the same way.
   No hand-written migration. No backfill: existing rows stay null.
2. Validation helper. `src/utils/live-stream.ts` exporting
   `isLiveStreamUrl(value: string): boolean` and a co-located `src/utils/__tests__/live-stream.unit.spec.ts`.
   Rule: parse with `new URL`; protocol `https:`; hostname lowercased and stripped of a leading `www.`/`m.` must be
   `youtube.com`, `youtu.be` or `instagram.com`; pathname must be more than `/`. Everything else false (no `http:`,
   no other hosts, no `youtube.com.evil.dev`, no `javascript:`).
3. Body validator. `src/api/vendor/auctions/validators.ts` (shared by both routes; the admin route imports it): add
   `SetAuctionLiveLink = z.object({ live_stream_url: z.string().trim().max(2048).nullable() }).strict()`
   and `.refine(v => v.live_stream_url === null || isLiveStreamUrl(v.live_stream_url), { message: "Tautan siaran harus dari YouTube atau Instagram (https)." })`.
   `null` clears the link. Register it in `src/api/middlewares.ts` next to the other `/vendor/auctions/:id` entries
   (:445-449), method POST, matcher `/vendor/auctions/:id/live-link`, and again for `/admin/auctions/:id/live-link`.
4. Workflow. `src/workflows/set-auction-live-link.ts`, one workflow both routes call:
   `acquireLockStep({ key: "auction:<id>", timeout: 10, ttl: 30 })`
   (same key as submit/update, via `transform` at `update-draft-auction.ts:37-39`) → new read-only guard step
   `getAuctionForLiveLinkStep` in `src/workflows/steps/auction.ts` (fields id, seller_id, status via query.graph;
   404 for missing or another seller's auction, like `getDraftAuctionStep` :246-292; 409 code `auction_not_editable`,
   Indonesian message, when status is `closed` or `cancelled`) → `setAuctionFieldsStep({ id, update: { live_stream_url } })`
   (reuse :378-405; its compensation restores the previous value) → `releaseLockStep`.
   Add `"live_stream_url"` to the `AuctionFields` pick union (:361-373). No `if`/loop in the composition function.
   `validateSellerOpenStep` goes in the **vendor route's** composition before the lock (a suspended farm gets 403 there,
   D-054/task-brief checklist); the admin route does not run it, so an admin can still fix a suspended farm's link.
5. Routes, both thin, same workflow:
   - `src/api/vendor/auctions/[id]/live-link/route.ts`: `POST` → 200 `{ auction: VendorAuction }`
     (`toVendorAuction(result)`), body type `SetAuctionLiveLinkType`. Import `../../../../../types/seller-context`.
     Composition: `validateSellerOpenStep({ seller_id: req.seller_context.seller_id })` → the shared workflow.
   - `src/api/admin/auctions/[id]/live-link/route.ts` (D-061, for admin-koi T-046.5): `POST` → 200 `{ auction: AdminAuction }`
     (reuse `toAdminAuctions`), same body type. Medusa's `/admin/*` auth is the guard; the `seller_id` for the workflow
     comes from the auction row read, never the body.
   - No GET on either (the field rides on the existing detail and list responses).
6. Exposure. Vendor: add `"live_stream_url"` to `AUCTION_FIELDS` (`src/api/vendor/auctions/route.ts:56-72`) and
   `live_stream_url: string | null` to `VendorAuction` (:29-46) and `toVendorAuction` (:127-147).
   Public: add `"auction.live_stream_url"` to `STORE_LOT_FIELDS` (`src/api/store/lots/route.ts:66-72`), add
   `live_stream_url: string | null` to `StoreLot.auction` (:35-47) and to the mapper (:139-151). It appears on both the
   feed and `GET /store/lots/:id`; a draft/pending/cancelled auction's lot still 404s, so its link can't leak.
   Admin: `AdminAuction` already spreads `AUCTION_FIELDS`, so the admin list and detail carry the field with no new list.
7. Run `bun run codegen` (new routes: `vendor.auctions.$id.liveLink`, `admin.auctions.$id.liveLink`).

## Start from
- src/workflows/update-draft-auction.ts:32-87 (validateSellerOpenStep + lock + guard + mutation + release)
- src/workflows/steps/auction.ts:246-292 (guard shape), :361-405 (AuctionFields + setAuctionFieldsStep)
- src/api/vendor/auctions/[id]/submit/route.ts:18-40 (POST with no body handling + envelope)
- src/api/vendor/auctions/[id]/route.ts:60-74 (detail envelope), ../route.ts:56-72,127-147 (fields + mapper)
- src/api/admin/auctions/route.ts:18-35 (AdminAuction type + ADMIN_AUCTION_FIELDS; the admin detail reuse)
- src/api/store/lots/route.ts:66-72,98-152 (public fields + mapper)
- src/utils/mask.ts:1-15 + src/utils/__tests__/mask.unit.spec.ts (unit helper layout)
- integration-tests/http/farmer-auctions.spec.ts:57-110 (seller + member + `x-seller-id` seeding)
- integration-tests/http/admin-auction-approval.spec.ts (admin token seeding)
- integration-tests/http/store-lots.spec.ts:1-60 (publishable key in a spec)

## Do not touch
- apps/** (no frontend in this task)
- the existing auction columns, the existing migrations, `src/workflows/{create-auction,submit-auction,update-draft-auction,place-bid}.ts`
  (import only), `src/api/store/lots/[id]/route.ts` (it inherits the field through the shared mapper)
- docs/

## Spec
packages/api/integration-tests/http/auction-live-link.spec.ts:
- scheduled auction → 200, one row saved, `auction.live_stream_url` in the response; live auction → allowed
- `{ live_stream_url: null }` clears a previously set link (200, null stored)
- refused 400 with nothing saved: `http://youtube.com/x`, `https://youtube.com.evil.dev/x`, `https://tiktok.com/x`,
  `https://instagram.com/` , `"  "`
- another seller's auction → 404; closed → 409 `auction_not_editable`; cancelled → 409; value unchanged in the DB
- seller pending_approval / suspended → 403 (validateSellerOpenStep)
- `GET /vendor/auctions/:id` and `GET /vendor/auctions` carry the field
- `GET /store/lots` and `GET /store/lots/:id` carry `auction.live_stream_url` for a public auction; a draft auction's
  lot with a link is still 404; the response contains no other new key
- identity only from the token: a body carrying `seller_id` is refused by `.strict()`
- admin (D-061): `POST /admin/auctions/:id/live-link` on a `scheduled` auction, even one whose farm is suspended → 200,
  value saved, carried by `GET /admin/auctions`; closed → 409; bad host → 400; `null` clears; a customer/member token
  → 401/403

## Definition of done
cd packages/api && bun x tsc --noEmit -p .                        → clean
cd packages/api && bun run codegen                                → routes.d.ts has vendor.auctions.$id.liveLink and admin.auctions.$id.liveLink
cd packages/api && bun run test:integration:http -- auction-live-link → pass (alone)
cd packages/api && bun run test:unit -- live-stream.unit             → pass
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (both routes: method, path, body, response, errors) + the migration file name.

## Open questions
none blocking. D-061 fixes the storage (column), the window (any status but `closed`/`cancelled`) and the render
(outbound link); say so if the admin route cannot share the workflow.
```

```text
Story: US-046 (task T-046.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-046.1 has delivered its contract and codegen.
Uses: US-045's `useLotPoll` (`src/hooks/use-lot-poll.ts:26`). Do not write a second poller.

## Acceptance criteria (verbatim)
- AC1: Shows one lot at a time: photo, current price, countdown, bid feed.
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built.
  (UI: the link is shown as an outbound link when set; nothing when unset. No embed, no player.)

## Decisions in force
D-046 / D-050: the room only stages lots of `scheduled`/`live` auctions; a cancelled lot is never staged; a closed
  lot keeps its last price but stops polling.
D-051: bid rows are the API's masked `bidder` strings, rendered verbatim; never re-mask, never sort client-side.
D-055: Indonesian copy, rupiah `id-ID` via `formatPrice`.
D-005: `@koi/ui` only; data only through `src/lib/data`; typed client only, never raw `fetch`.
US-045: `LOT_POLL_MS` is the only interval. No websocket, no SSE, no new dependency.

## Pinned response shape (from T-046.1; consumed exactly as written)
StoreLot = { id, title, description, photos: string[], ob, kb, current_price: number|null, end_time: ISO,
             final_price: number|null, sold: boolean|null, cancelled: boolean, bid_count: number,
             auction: { id, status: "scheduled"|"live"|"closed", start_at, end_at, join_fee, delivery_method,
                        category: {id,name}|null, seller: {id,name,handle}|null,
                        live_stream_url: string | null } }
GET /store/lots?limit&offset&status  → { lots: StoreLot[], count, limit, offset }   (no `bids` on feed rows)
GET /store/lots/:id                  → { lot: StoreLot & { bids: { bidder, amount, created_at }[] } }

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/lots?limit=100 | yes, `packages/api/src/api/store/lots/route.ts:239-254` | no status → scheduled + live, `end_time` ASC; carries `bid_count`, `photos`, `auction.live_stream_url` |
| GET | /store/lots/:id | yes, `src/api/store/lots/[id]/route.ts:18-57` | detail adds masked `bids[]`; 404 when the lot or its auction isn't public |
| GET | /store/lots?limit=100 (the link field) | **partly** — `auction.live_stream_url` does not exist until T-046.1 | added by T-046.1, ordered first |
No other route is read. No client auth: the room is public.

## Build
1. `app/(main)/live/page.tsx`: this is a server page (Next 15) — accept `searchParams: Promise<{ lot?: string }>`,
   await it, pass `featuredId` to `<LivePage featuredId={...} />`. Keep the existing `<Suspense>`; `metadata` unchanged.
2. `components/sections/LivePage/LivePage.tsx` (server): load `listLots({ limit: 100 })` (`src/lib/data/lots.ts:69-79`).
   Load `getLot(featuredId)` instead when `featuredId` is given and is not in the list (one extra read; `null` on 404).
   Pass `lots` (StoreLot[]) and `featuredId` into `LiveRoomPage`. No demo constants.
3. `components/sections/LivePage/components/LiveRoomPage.tsx` (client): now owns the staged lot.
   - `stagedId` = `featuredId` when it maps to a non-cancelled lot, else the first lot whose `auction.status === "live"`,
     else the first non-cancelled lot whose auction is `scheduled`, else none (keep `pickFeatured`'s reading; update its
     signature to the real lot type and delete the demo docs).
   - `const polled = useLotPoll(stagedId, enabled)` with `enabled = !!stagedId && !staged.cancelled && staged.sold === null`.
     Never call it with `""`.
   - Prefer the polled lot's `current_price`, `bid_count`, `bids`, `end_time`, `sold`, `cancelled`, `auction.status`
     over the server props, then map through `toAuctionProduct` (`src/lib/adapters/lot.ts:14-58`). Static fields
     (photos, title, listing, seller) keep the server props.
   - Delete the local `staged`/`place()` fake-bid state (`LiveRoom.tsx:96-141`) and the `bidsFor` fallback.
4. `components/sections/LivePage/components/LiveRoom.tsx`: replace defaults with required real props.
   - Drop `lots = DEFAULT_AUCTION_LOTS`, `media = DEFAULT_LIVE_MEDIA` (for the room; derive media from `lot.photos`),
     `buyNow`, `ticker`, `stats` defaults. Keep `TRAIL_ROWS`.
   - `BroadcastBar`: pass `liveCount` = number of `live` auctions in the list; pass no `stats` and no fabricated ticker
     (the old "Escrow terkunci Rp 1,42 M / Latency 18ms" claims are gone). An optional short factual message is fine.
   - Pass no `buyNow` (buy-now is out of MVP scope).
   - Live link (D-061): when the staged lot's `auction.live_stream_url` is set, render one outbound link near the board —
     `<a href={url} target="_blank" rel="noopener noreferrer">Tonton siaran langsung petani →</a>` (Indonesian; no iframe,
     no player, no preview fetch). Nothing when unset.
   - Board: `BidTerminal` with the polled lot, no `onBid`, no `myBid`, and a new `readOnly` prop (see below) so the raise
     chips / bid button / buy-now / "Saldo cukup" line are not drawn. Under the board render a CTA
     `Button`/`Link` to `lotHref(lot.id)`: "Pasang bid di halaman lot". The room does not place bids (US-042 owns that).
   - `BidHistory variant="inline"` gets `lot.auction.bids?.slice(0, TRAIL_ROWS)`; keep the "Lihat detail & semua" sheet.
   - Empty state (`staged` undefined): keep the block, replace the copy at `LiveRoom.tsx:258-279` (it promises
     "setiap Selasa dan Jumat pukul 20.00 WIB", a schedule the plan doesn't have) with an honest one, e.g.
     "Belum ada lelang yang sedang berlangsung." + "Lot yang sedang dibuka akan tampil di sini saat lelang dimulai."
     + the button to `/lelang`.
   - Keep `LotLayout`, `LotLiveStage`, `SpecSheet`, `LotTrustList`, `PageShell`; keep `RoomHref`/breadcrumb behaviour.
5. `components/organisms/BidTerminal/BidTerminal.tsx`: add `readOnly?: boolean` (default `false`). When true, render the
   identity, the band with the price and clock, and the `myBid` line; hide the raise row, the bid button, the
   "Saldo cukup" line and the buy-now row. No other behaviour changes; `SpotlightStage` and any other caller keep the
   default.
6. `const/live.ts`: delete `DEFAULT_AUCTION_LOTS`, `bidsFor`, `DEFAULT_BROADCAST_TICKER`, `DEFAULT_LIVE_STATS`,
   `DEFAULT_BUY_NOW`. Keep `DEFAULT_LIVE_MEDIA` (ProductPage imports it), `LIVE_TINT` (LiveBand imports it), `mediaFor`
   (used for the room's media) and `TRAIL_ROWS`. Update the file header comment (demo-room note is obsolete).

## Start from
- components/sections/LivePage/components/{LiveRoomPage,LiveRoom}.tsx (the room, its props, the empty state)
- components/sections/LotDetailsPage/components/LotPage.tsx:78-90,337-345 (prefer-polled-fields pattern from US-045)
- src/hooks/use-lot-poll.ts:26-96 (call it, don't change it)
- src/lib/adapters/lot.ts:14-58 (StoreLot → AuctionProduct)
- src/lib/data/lots.ts:69-79 (listLots), :281-289 (getLot)
- components/organisms/BidTerminal/BidTerminal.tsx:21-140,190-284 (props + control block)
- components/cells/BroadcastBar/BroadcastBar.tsx:16-60 (message/liveCount/stats props)

## Do not touch
- packages/api/**, apps/admin-koi/**, `src/hooks/**`, `src/lib/helpers/poll.ts` (US-045)
- `src/components/sections/LotDetailsPage/**`, `src/lib/adapters/lot.ts` (read only), `src/components/organisms/SpotlightStage/**`
- `const/live.ts`'s `DEFAULT_LIVE_MEDIA` / `LIVE_TINT` (other screens import them)
- the cart, the catalog, `akun/kebun/**` (T-046.3 owns the farmer form)

## Definition of done
cd apps/storefront-koi && bun run check                        → pass (tsc + node:test + lint)
cd apps/admin-koi && bun run tsc                               → clean (T-046.1 changed `packages/api/src`)
grep -rn "DEFAULT_AUCTION_LOTS\|bidsFor\|DEFAULT_LIVE_STATS\|DEFAULT_BUY_NOW\|DEFAULT_BROADCAST_TICKER" apps/storefront-koi/src
  → no hits
render-check skill (playwright MCP) on http://127.0.0.1:3001/live with a seeded live auction: photo, live price,
  countdown and masked bid rows; no console/hydration error, no "undefined"/"NaN"/"[object Object]";
  screenshot path recorded
Poll proof: with /live open, a second seeded customer places a bid on the staged lot (`POST /store/bids` or the lot page);
  price and the bid row change within one interval (~2 s, allow 4 s), no reload.
Link proof: set a link on the staged auction (T-046.1 route or the T-046.3 form), reload /live → the link renders with
  `href` equal to the stored URL, `target="_blank"`, and no iframe in the DOM.
Empty proof: with no scheduled/live auction, /live shows the honest empty state.
Report: standard header + render check result + screenshot paths. Don't commit.

## Open questions
none blocking. mvp-Q42 (auto-rotation) is not built: the room stages one lot, `?lot=` selects it, and that meets AC1.
If the owner asks for rotation, it is a follow-up inside `LiveRoomPage`.
```

```text
Story: US-046 (task T-046.3)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=30 min
Starts after: T-046.1 has delivered its contract and codegen.

## Acceptance criteria (verbatim)
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built.
  (UI: the farmer sets or clears it; a rejected link shows the backend's Indonesian message; the saved value is shown.)

## Decisions in force
D-003: every `/vendor/*` call needs the member token + `x-seller-id`, through `vendorHeaders()` (`src/lib/data/vendor.ts`).
D-055: show the server's message verbatim; key on status/code, never on message text.
D-005: `@koi/ui` only; data only through `src/lib/data`; typed client only.
D-061: the route accepts every status except `closed` and `cancelled` (409), so the form is offered for `draft`,
`pending_approval`, `scheduled` and `live`, and is read-only for the two terminal statuses. The link renders as an
outbound link only, no embed.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /vendor/auctions/:id | yes, `packages/api/src/api/vendor/auctions/[id]/route.ts:60-74` | `{ auction: VendorAuction }`, carries `live_stream_url` after T-046.1 |
| POST | /vendor/auctions/:id/live-link | **no** → T-046.1 (ordered first) | body `{ live_stream_url: string \| null }`; 200 `{ auction }`; 400 invalid URL; 403 farm not open; 404 not yours; 409 `auction_not_editable` |

## Build
1. `src/lib/data/auctions.ts`: add `live_stream_url: string | null` to `Auction` (:42-59), and
   `setAuctionLiveLink(id, url: string | null): Promise<Result<Auction>>` calling
   `sdk.vendor.auctions.$id.liveLink.mutate({ $id: id, live_stream_url: url, fetchOptions: { headers } })`
   (same shape as `updateDraftAuction`, :216-239: `revalidatePath(ROUTES.farmHome)`, `ClientError.message` on failure).
   `toAuctionDetail` (:104-111) spreads the route's auction, so the field flows through once `Auction` has it.
2. `src/lib/helpers/live-stream-url.ts` + `.test.ts` (node:test, `.ts` imports): `isLiveStreamUrl(value)` with the same
   rule as the backend (https; `youtube.com`, `youtu.be`, `instagram.com` after stripping a leading `www.`/`m.`;
   non-empty path). Pure, no fetch. Cases: valid YouTube watch/short link, valid Instagram live link, `http://`, another
   host, `youtube.com.evil.dev`, empty.
3. `src/components/sections/AccountPage/components/LiveLinkForm.tsx`: one card, `react-hook-form` + zod like the existing
   forms; field `live_stream_url` (URL input, `inputMode="url"`, placeholder `https://www.youtube.com/live/…`).
   - Client pre-check with `isLiveStreamUrl` on non-empty input → inline error in Indonesian, e.g.
     "Tautan harus dari YouTube atau Instagram (https)." Never block a clear.
   - Buttons: "Simpan tautan" and, when a link exists, "Hapus tautan" (submits `null`). Busy state, success toast
     "Tautan siaran tersimpan." / "Tautan siaran dihapus." (Indonesian).
   - A failed call shows `result.error` (the backend message) as a toast; nothing is optimistically saved.
   - Show the currently stored link as an outbound `<a target="_blank" rel="noopener noreferrer">` when set; show
     "Belum ada tautan siaran." when not.
   - Card copy explains the rule: "Tautan YouTube atau Instagram untuk siaran lelang. Tidak ada video yang diunggah ke
     Koi Store." Do not promise an embed or a viewer.
4. `src/components/sections/AccountPage/components/EditAuction.tsx`: render `<LiveLinkForm>` above the auction cards
   when `auction.status` is `draft`, `scheduled` or `live`; for `closed`/`cancelled` render nothing (the auction is done).
   Do not wire it into the draft-only `persist()` submit path. Keep the rest of the screen as it is.
   Add `setAuction` update from the response so the shown link changes without a reload (the page already holds the
   auction in `useState`).
5. `src/const/routes.ts`: no new page route (the form lives on the existing auction detail page). Don't add one.

## Start from
- src/components/sections/AccountPage/components/EditAuction.tsx:71-84,212 (component + editable state + return)
- src/components/sections/AccountPage/components/ReviewForm.tsx (form/card layout in the Farmer area)
- src/lib/data/auctions.ts:42-59 (Auction type), :216-239 (updateDraftAuction: Result + revalidate + ClientError)
- src/lib/helpers/auction-submit.ts + .test.ts (helper/test layout)
- src/components/cells/SpecSheet, `@koi/ui` Card/FormField/Input/Button (the kit's own pieces)

## Do not touch
- packages/api/**, apps/admin-koi/**, `components/sections/LivePage/**` (T-046.2), `const/live.ts`
- `updateDraftAuction` / `persist()` semantics, the submit button, the lots editor
- `src/lib/helpers/poll.ts`, the lot page

## Definition of done
cd apps/storefront-koi && bun run check                        → pass
cd apps/admin-koi && bun run tsc                               → clean
render-check skill on http://127.0.0.1:3001/akun/kebun/lelang/<a scheduled or live auction id> signed in as
  sakura.koi.farm@koi.dev:
  - save a valid YouTube link → toast, link shown after submit; reload → still shown
  - submit an invalid host → inline error, no toast of success, stored value unchanged
  - clear it → "Belum ada tautan siaran."
  screenshot paths recorded
Report: standard header + render check result + screenshot paths. Don't commit.

## Open questions
none
```

```text
Story: US-046 (task T-046.5)   Release: mvp
Agent: frontend (apps/admin-koi)   Expected: <=30 min
Starts after: T-046.1 delivered `admin.auctions.$id.liveLink` and codegen.

## Acceptance criteria
- AC2: The farmer can add a YouTube or Instagram live link, which is shown on the page. No video system is built.
  (This task: the admin-koi write required by D-061 — the admin can set or clear an auction's live link.)

## Decisions in force
D-061: the admin writes the same `auction.live_stream_url` through `POST /admin/auctions/:id/live-link`, any status but
`closed`/`cancelled`; the value renders as an outbound link, no embed, no host check beyond the allow-list.
D-002: admin surfaces live only in `apps/admin-koi`, through `/admin/*` routes.
D-055: show the server's Indonesian message verbatim; key on status/code, never on message text.
D-005: `@koi/ui` only; data only through `src/lib/data`; the typed `@mercurjs/client`, never raw `fetch`.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /admin/auctions | yes (US-032) | queue rows already carry the auction; `live_stream_url` appears once T-046.1 lands |
| POST | /admin/auctions/:id/live-link | after T-046.1 | body `{ live_stream_url: string \| null }` → 200 `{ auction: AdminAuction }`; 400 bad host (Indonesian), 409 `auction_not_editable` |

## Build
1. `src/lib/data/auctions.ts`: add `live_stream_url: string | null` to `AdminAuction`; add
   `setAuctionLiveLink(id, url: string | null)` calling
   `sdk.admin.auctions.$id.liveLink.mutate({ $id: id, live_stream_url: url, fetchOptions: { headers: getAuthHeaders() } })`,
   mirroring the existing admin mutations (revalidate `/lelang`, `ClientError.message` on failure).
2. One control on the `/lelang` queue row (`AuctionQueue.tsx`): the stored link as an outbound
   `<a target="_blank" rel="noopener noreferrer">` when set, "Belum ada tautan siaran." when not, an input + "Simpan
   tautan" and "Hapus tautan" (submits `null`). Client pre-check reuses the same host rule as the backend; a failed call
   shows the server's Indonesian message. Offered in any status except `closed`/`cancelled`; otherwise read-only.
   Keep the row's existing approve/reject behaviour untouched.
3. No new nav entry and no new page: this is a control inside the existing queue row.

## Start from
- apps/admin-koi/src/components/AuctionQueue.tsx (the row + its server actions)
- apps/admin-koi/src/lib/data/auctions.ts (AdminAuction, getAuctionQueue, the action shape)
- apps/admin-koi/src/components/FarmQueue.tsx:257-313 (the reveal/link button pattern)

## Do not touch
- packages/api/**, apps/storefront-koi/**, the approve/reject flow, the `/lelang` page shell

## Definition of done
cd apps/admin-koi && bun run check                       → pass
cd apps/storefront-koi && bun run tsc                    → clean
render check (http://127.0.0.1:3002/lelang as admin@koi.dev) on a `pending_approval` and a `scheduled` auction:
save a valid link, clear it, one invalid host → clean; screenshot paths recorded.
Report: standard header + render check result + screenshot paths. Don't commit.

## Open questions
none
```

**`mvp-Q42` (answered as a built choice, not a blocker):** explicit selection. The room stages the tightest live lot,
`?lot=` picks another, no rotation; AC1 asks for one lot at a time and not for rotation. Rotation would be a follow-up
inside `LiveRoomPage` with no backend work. Option (a) is what T-046.2 ships.
**`mvp-Q43` answered by D-061:** the live link is a plain nullable `auction.live_stream_url` column, set by the farmer
through `POST /vendor/auctions/:id/live-link` (member token + `x-seller-id`) and by an admin through
`POST /admin/auctions/:id/live-link`, writable until the auction is `closed`/`cancelled`, rendered as an outbound link
(no embed, no player, no host check beyond the YouTube/Instagram allow-list). admin-koi exposes the write on its
`/lelang` queue row (T-046.5).

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

### US-051 Farmer sees the winner's name and address; winner sees their won lots · `done (evidence: packages/api/integration-tests/http/won-lots.spec.ts (12/12), vendor-sold-lots.spec.ts (22/22), claims-read/won-lot-delivered (15/15); packages/api/src/api/store/won-lots/route.ts:86-111,135-138 (`pay_by` = `closed_at` + 24 h), :162-203 (masked `seller.payment_details`, batched read), :34-41,53-67 (no phone field at all); packages/api/src/workflows/reveal-lot-contact.ts:42-48 (winner + sold status guard → 404, no existence leak), :71-76 (no bank row → 404, no audit), :101-123 (one `createPiiRevealAuditStep`, field `bank_account`, value returned only after the row); packages/api/src/api/store/won-lots/[id]/reveal/route.ts:16-28; packages/api/src/api/middlewares.ts:381-391 (customer auth + body Zod, enum = `bank_account` only); apps/storefront-koi/src/components/sections/AccountPage/WonLotsPage.tsx:152-158 ("Bayar sebelum … WIB"), :192-194 (RevealBank); components/RevealBank.tsx:26-80 (fetch on click only, masked → full pair, D-057); storefront `bun run check` 202/202, admin-koi 36/36, lint clean; browser /akun/menang masked "S***** K** · ******7890" → full after click, one click = one audit row, 3 → 4 rows; qa PASS after D-058/D-059 reopen)`
**Accepted 2026-11-17 (qa PASS, fix round 1), still in force for AC2, AC4, AC5 and the address part of AC6:** packages/api/integration-tests/http/won-lots.spec.ts (6/6), vendor-sold-lots.spec.ts (16/16); packages/api/src/api/vendor/sold-lots/route.ts:17-19,42-54,61-103,105-148 (name + city/province only, no street/postal/phone selected); packages/api/src/workflows/reveal-winner-address.ts:34-47 (read then one audit row, record_type lot, field shipping_address); packages/api/src/workflows/steps/sold-lot.ts:61-119 (404 no-address before audit); packages/api/src/api/vendor/sold-lots/validators.ts:24 (enum = shipping_address only); packages/api/src/api/store/won-lots/route.ts:22-40,50-63,112-127 (seller id+name, has_shipping_address); apps/storefront-koi/src/components/sections/AccountPage/components/RevealAddress.tsx:39-41,81-95; SoldLotsPage.tsx:82,244-247; WonLotsPage.tsx:83-92; LotDetailsPage/components/WonLotPanel.tsx:77-89 (add-address prompt); packages/api bun x tsc --noEmit exit 0; storefront bun run check exit 0 (182 tests); browser 8 render checks 200, /tmp/koi-render/recheck1/.
**Depends on:** US-092 (masking and the logged reveal).
As a **farmer**, I want the winner's name and delivery address so that I can ship the fish; as a **winner**, I want
my won lots listed so that I can see what I won, pay the farmer and mark it delivered. *(Plan: Closing and winners,
Delivery; D-044 restored by D-059, D-052, D-056, D-057)*
- AC1: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044/D-059) and nothing else, plus the 1×24 h payment deadline from `closed_at` (D-058). No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC2: The farmer sees, for their own sold lots, the winner's name and the winner's default shipping address masked: `city` and `province` only; street lines and postal code are not sent (D-056). No winner phone, masked or full (D-052). *(Changed 2026-11-16, `mvp-Q37`: was "name only, no reveal".)*
- AC3: The farmer's bank account is shown masked on the winner's own won lot; the winner reveals the full account number **and** full account-holder name for their own winning lot only, in one logged reveal (`field: "bank_account"`, one audit row) (D-044, D-057, D-059). Until the reveal, the winner sees a mask and the account number is never in the list response.
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-056).
- AC5: The farmer reveals the winner's full default shipping address for their own sold lot only, through the logged reveal: one `pii_reveal_audit` row per reveal, `record_type: "lot"`, `record_id: <lot id>`, `field: "shipping_address"`. If the winner has no default shipping address, the row shows "Alamat belum diisi" with no reveal button, and a reveal call gets 404 with no audit row (D-056).
- AC6: The winner sees their own won lots, and for each the farm name, bank name and the masked account number and holder name, but no farmer phone, masked or full (D-052, D-059). A winner with no default shipping address sees a prompt on the won lot to add one, linking to `/akun/alamat` (D-056).
**PII (D-039, D-052, D-056, D-059):** the winner's full address is a narrow exception for the farmer of that lot, through the same logged reveal as the admin. The farmer's full bank account is a narrow exception for the winner of that lot, through the same logged reveal (D-059); the merchant's account is never in a list response and never partially shown. No phone crosses between winner and farmer (D-052).
- [x] T-051.1a [backend] `GET /store/won-lots`: the winner's own won lots, farm name, bank name, masked account number and holder name, 1×24 h deadline; no phone (D-052) *(unparked 2026-11-17, D-059; builds on the shipped T-051.6 row: add `pay_by` = `closed_at` + 24 h and the masked `seller.payment_details`)*
- [x] T-051.3a [backend] `POST /store/won-lots/:id/reveal`: winner reveals the farmer's bank account number and holder name for their own lot, one audit row (D-057) *(unparked 2026-11-17, D-059)*
- [x] T-051.1b [backend] `GET /vendor/sold-lots`: the farmer's own sold lots with the winner's name and masked default shipping address (city + province, D-056); no phone (D-052)
- T-051.3b *(dropped 2026-11-16, D-052: the farmer no longer reveals the winner's phone. Not built. D-059 does not bring it back.)*
- [x] T-051.5 [backend] `POST /vendor/sold-lots/:id/reveal`: the farmer reveals the winner's full default shipping address for their own sold lot; one audit row per reveal (D-056) *(new 2026-11-16)*
- [x] T-051.6 [backend] `GET /store/won-lots` without farmer contact: the winner's own won lots plus `has_shipping_address` (D-056) *(new 2026-11-16; superseded in part by T-051.1a's new fields, the route and auth stay)*
- [x] T-051.2a [storefront] Won lots page `/akun/menang` with the bank-account reveal *(unparked 2026-11-17, D-059; builds on the shipped T-051.7 page)*
- [x] T-051.7 [storefront] Won lots page `/akun/menang` with no farmer contact and the "add an address" prompt (D-056) *(new 2026-11-16; US-053 T-053.2 sits on it)*
- [x] T-051.2b [storefront] Sold lots page in the Farmer area (winner's name, masked address, address reveal)
- [x] T-051.4 [qa] Other users get 404 or no data; the full address and the full bank account are reachable only for the caller's own lot and every reveal is audited; no phone in any won-lot or sold-lot response or page *(re-opened 2026-11-17 for AC1/AC3 and T-051.1a/.3a/.2a; the AC2/AC5 half passed 2026-11-17; the bank-reveal half passed 2026-11-18)*

**Accepted 2026-11-17 (qa PASS, fix round 1) for AC2, AC4, AC5 and the no-contact part of AC6.**
Each checked against the code and the spec output above; AC1 and AC3 were parked then and are
back in scope now (D-059). Two non-bug notes from qa, recorded,
not fixed here:
1. A terminated farm sees "Area petani belum terbuka / Akun ini belum punya
   kebun…" (`SoldLotsPage.tsx:287-300`) instead of terminated copy, because
   Mercur's `GET /vendor/sellers` filters out `terminated` sellers, so
   `getMyFarm()` returns null (`apps/storefront-koi/src/lib/data/farm.ts:52-69`).
   The rule holds (no rows, no actions); copy follow-up, not a FAIL.
2. Seeded Budi's default address has `province: null`, so his masked row shows
   only "Jakarta Selatan". Seed data, not a bug.
**Accepted 2026-11-18 (qa PASS after the D-058/D-059 reopen) for AC1–AC6.**
Re-opened 2026-11-17 (D-059) because the bank reveal (T-051.1a, daily `pay_by`
and masked row; T-051.3a, the one logged reveal; T-051.2a, the win page) and the
escrowed-payment note were superseded; both are gone now.
AC1 checked at `won-lots/route.ts:101-102,135-138` (pay_by = closed_at + 24 h),
`WonLotsPage.tsx:152-158` ("Bayar sebelum … WIB" while `won`),
`reveal-lot-contact.ts:42-48` (winner-only guard), `WON_LOT_FIELDS` (`route.ts:86-99`,
no phone selected) and the spec's stringified-JSON assertions
(`won-lots.spec.ts:320-340`, no phone key, no `wa.me`).
AC2 re-checked: farmer rows select city+province only (`vendor/sold-lots/route.ts:60-100`);
22/22 spec.
AC3 at `route.ts:162-203` (maskName + maskAccountNumber, masked in the mapper)
and `RevealBank.tsx:26-80` (fetch on click only; browser "S***** K** · ******7890"
→ "Sakura Koi · 1234567890"). Exactly one audit row per reveal
(`reveal-lot-contact.ts:101-123`; spec `:370-410`); no row on any 404;
`field:"phone"` → 400; anonymous → 401.
AC4 row fields all asserted (actor_type, actor_id, `record_type: "lot"`, record_id, field).
AC5/AC6 stand on their 2026-11-17 evidence.
**Wording note (2026-11-18):** D-059's "never in a list response, never
masked-and-partially-shown" contradicted AC3's required mask; the decision now
says a list or detail response carries at most a mask, corrected with a note.
Seed note (not code): the seeded lot had `won` with `closed_at: null`.
Still open, non-blocking: `mvp-Q47` (US-056's refusal state) — unchanged, does
not touch this story.
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
UNPARKED 2026-11-17 (D-059). Active. Adds the bank fields and `pay_by` to T-051.6's shipped route; its auth and paging stay.
Story: US-051 (task T-051.1a)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: US-050 T-050.1 (winner_customer_id, final_price, closed_at).

## Acceptance criteria
- AC1: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044/D-059) and nothing else, plus the 1×24 h deadline (D-058). No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC3: The farmer's bank account is shown masked; the winner reveals the full account number for their own winning lot only, through the logged reveal (D-044/D-059). Until the reveal, the winner sees a mask and the account number is never in this list response.

## Decisions in force
D-052: never select or return the farm's phone (seller.phone), masked or not. D-044 (back in force by D-059): account
masked here; full only via T-051.3a. D-057: one reveal returns number + holder name, one row. D-058: `pay_by` =
`closed_at` + 24 h; the winner pays the farmer directly. D-046: this is the caller's own data, not a public route;
store/lots/** stays winner-free.
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
UNPARKED 2026-11-17 (D-059). Active; D-057 is in force.
Story: US-051 (task T-051.3a)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: T-051.1a.

## Acceptance criteria
- AC3: … the winner reveals the full account number **and** full account-holder name for their own winning lot only, in one logged reveal (`field: "bank_account"`, one audit row) (D-044, D-057).
- AC4: Every reveal is recorded: who, when, which lot, which field (D-042, D-056).

## Decisions in force
D-044 (back in force by D-059): full bank account, winner's own lot only, logged reveal. D-057: one reveal returns number + holder name, one
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
UNPARKED 2026-11-17 (D-059). Active; builds on T-051.7's shipped page.
Story: US-051 (task T-051.2a)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=45 min
Starts after: T-051.1a and T-051.3a contracts.

## Acceptance criteria
- AC1: Only the winner of that lot sees the farmer's bank account (full, via the logged reveal, D-044/D-059) and nothing else, plus the 1×24 h deadline (D-058). No phone either way: no farmer phone or WhatsApp number, masked or full, and no `wa.me` link (D-052).
- AC3: The farmer's bank account is shown masked; the winner reveals the full account number **and** holder name for their own winning lot only, through the logged reveal (D-044/D-057/D-059). Until the reveal, the winner sees a mask.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /store/won-lots | after T-051.1a | { lots: [{ id, status, final_price, closed_at, pay_by, product, auction, seller: { id, name, payment_details(masked) } }], count } |
| POST | /store/won-lots/:id/reveal | after T-051.3a | { field: "bank_account" } → 200 { field, value: { account_number, holder_name } } |

## Build
- Route /akun/menang (ROUTES.wonLots in const/routes.ts), requireCustomer guard; link from AccountNav.
- Data: lib/data/lots.ts with getAuthHeaders(); typed sdk only, no raw fetch.
- Extends the shipped T-051.7 page: add the pay-by deadline (formatDeadline), bank name, masked holder name and masked
  account number, plus a "Tampilkan" button. The reveal fetches on click only (never on render:
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
(SHIPPED 2026-11-17. Superseded in part by T-051.1a, D-059: the same route gains `pay_by` and the masked bank details; its auth, paging and `has_shipping_address` stay.)
Starts after: US-050 T-050.1 (winner_customer_id, final_price, closed_at).

## Acceptance criteria
- AC6: The winner sees their own won lots with no farmer contact (no bank account, no holder name, no phone). A winner with no default shipping address sees a prompt on the won lot to add one, linking to `/akun/alamat` (D-056).
  (Current AC6 after D-059 adds the masked bank details on the row; T-051.1a delivers that.)

## Decisions in force
D-044 (in force again, D-059): this no-contact row is T-051.6's, T-051.1a adds the masked bank details. Never select seller.phone. D-052: no
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
- No pay_by field here: T-051.1a adds it (and the masked bank details) to this same route (D-058/D-059). bun run codegen.

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
  (Current AC6 after D-059 adds the masked bank details; T-051.2a adds them to this page.)

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /store/won-lots | after T-051.6 | { lots: [{ id, status, final_price, closed_at, product, auction, seller: { id, name } }], count, has_shipping_address } |

## Build
- Route /akun/menang (ROUTES.wonLots in const/routes.ts), requireCustomer guard; link from AccountNav.
- Data: lib/data/lots.ts with getAuthHeaders(); typed sdk only, no raw fetch.
- Rows: product, final price (formatPrice), closed date, status label, farm name. No bank details, no phone, no
  WhatsApp button, no wa.me link (D-044, D-052). No payment deadline here: T-051.2a adds it with the bank reveal (D-058/D-059).
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
Runs after the live build tasks (T-051.1b, .5, .2b, .6, .7, .1a, .3a, .2a).

Verify AC1–AC6, focused on the re-opened AC1/AC3 and T-051.1a/.3a/.2a. Decisions: D-039, D-042, D-044 (in force, D-059), D-045, D-052, D-056, D-057, D-058.
Code under test: src/api/store/won-lots/**, src/api/vendor/sold-lots/**, src/workflows/reveal-lot-address.ts,
src/workflows/reveal-lot-contact.ts, storefront /akun/menang and /akun/kebun/terjual.
Commands (alone): bun run test:integration:http -- won-lots; then -- sold-lots; then -- pii-reveal (regression);
bun run check in apps/storefront-koi.
Watch for: any phone (farm's, winner's or the address's, masked or full) or wa.me link in a response or page source;
a full account number in a won-lot list response; pay_by not `closed_at` + 24 h; a bank reveal that returns a value
without an audit row (or writes two, or one per field); another customer reaching a lot or a reveal (must be 404, no
audit row); a reveal for a lot that is not the caller's own won lot; reveal fired on render; address_1, address_2 or
postal_code in a sold-lots list response
or page source before a reveal; a reveal for a winner with no default address (404, no row); winner_customer_id or
email in a vendor response; a second audit table.
Browser: render-check /akun/menang as the winner (with and without a default address) and /akun/kebun/terjual as the
farmer (incl. one address reveal).
Report PASS/FAIL per AC with file:line and command output. Don't change app code.
```

### US-052 Farmer marks paid and shipped · `done (evidence: packages/api/integration-tests/http/vendor-sold-lots.spec.ts (22/22); packages/api/src/workflows/mark-lot-sold-status.ts:87-116 (`getPayableLotStep`: terminated → 403, another seller → 404, non-`won` → 409), :120-141 (`markLotPaidWorkflow`, lock `lot:<id>`, no wallet read), :143-166 (shipped half unchanged); packages/api/src/api/vendor/sold-lots/[id]/paid/route.ts:16-48 (identity from `req.seller_context`, strict empty body); packages/api/src/api/middlewares.ts:546-550; storefront helpers/sold-lot-actions.ts:6-13 (`won` → pay, `paid` → ship), sold-lots.ts:72-101 (paid action + revalidate), components/MarkPaid.tsx:27-65, SoldLotsPage.tsx:317-325; storefront `bun run check` 202/202, admin-koi 36/36, lint clean; browser won → "Tandai sudah dibayar" → "Sudah dibayar"/"Tandai dikirim" → resi QA-RESI-051 → "Dikirim"; D-058: spec :572-596 asserts wallet count and both balances unchanged; qa PASS after the D-058 reopen)`
**Depends on:** US-050 T-050.1; US-051 farmer side (T-051.1b, T-051.2b: the sold-lots page), US-092 (masking).
As a **farmer**, I want to mark a lot paid and then shipped so that progress is
tracked. *(Plan: Closing, Delivery; D-052, D-054, D-058)*
- AC1: `won → paid → shipped`, in order only. The winner pays the farmer directly, off-platform, within 1×24 h; the farmer marks the lot paid (`POST /vendor/sold-lots/:id/paid`), then ships it. No wallet debit, no ledger row, no payout in the MVP (D-058).
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC3: While shipping, the farmer sees the winner's name and masked address (D-056, US-051); no winner phone, masked or full, and no reveal from this story (D-052). *(Changed 2026-11-16: was "phone masked, full through US-051's reveal".)*
- AC4: A farm suspended after approval can still mark its own already-sold lots paid and shipped; a terminated farm can't (403). It still can't create auctions or lots (D-054).
**Re-opened 2026-11-17 (D-058).** The 2026-11-16 escrow note is void: D-058 chose
off-platform payment, so the farmer marking paid is the real `won → paid` step
again and T-052.4 is active. The shipped half, the sold-lots row and the
tracking number were accepted 2026-11-17 and stand.
- [x] T-052.1 [backend] `lot.tracking_number` + mark-shipped workflow + `POST /vendor/sold-lots/:id/shipped` (the farmer must own the lot); `won → paid` is T-052.4 *(split 2026-11-16)*
- [x] T-052.4 [backend] mark-paid workflow + `POST /vendor/sold-lots/:id/paid` *(unparked 2026-11-17, D-058: `won → paid` only, ownership + not `terminated`, no `validateSellerOpenStep`; no money moves)*
- [x] T-052.2 [storefront] Farmer area actions on the sold-lots page ("Tandai dikirim" accepted 2026-11-17; "Tandai sudah dibayar" re-opened with T-052.4) *(re-opened 2026-11-17, D-058; both actions passed 2026-11-18)*
- [x] T-052.3 [qa] States can't be skipped; no winner phone anywhere on the farmer's side (D-052); a suspended farm can finish its sold lots, a terminated one can't (D-054); `won → paid` works and no money moves (D-058) *(re-opened 2026-11-17 for the paid cases; the shipped cases passed 2026-11-17; the paid cases passed 2026-11-18)*

**Accepted 2026-11-18 (qa PASS after the D-058 reopen) for AC1–AC4.**
AC1's `won → paid` half (`mark-lot-sold-status.ts:87-116`) refuses anything but
`won` (`paid`, `shipped`, `delivered`, `cancelled` → 409, spec `:520-541`), and
the shipped half still refuses anything but `paid` (`:45-51`, spec `:656-678`).
No money moves: the spec asserts no `wallet_transaction` row and both balances
unchanged (`:572-596`, D-058), and the workflow reads no wallet.
AC2/AC3/AC4: tracking required for courier only (`:54-60`, spec `:680-698`);
the farmer sees the winner's name and masked city only (no phone, D-052);
suspended → 200, terminated → 403, neither route runs `validateSellerOpenStep`
(D-054). Browser walk: won → "Tandai sudah dibayar" → "Sudah dibayar" /
"Tandai dikirim" → resi QA-RESI-051 → "Dikirim".
**Transitions checked:** the paid guard refuses anything but `won`
(`mark-lot-sold-status.ts:103-108`); the shipped guard refuses anything but
`paid` (`:45-51`).
**Not verified by design:** concurrency on the paid/shipped lock (T-090.4's
in-memory limit); suspended/terminated flows in the browser (backend spec only).
Seed note (not code): the seeded lot had `won` with `closed_at: null`.

**Readiness (2026-11-16; shipped half accepted 2026-11-17; paid half accepted 2026-11-18): `done`.** D-058 and D-054 decided the policy (`mvp-Q34` → D-052, `mvp-Q36` → D-054).
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
Split 2026-11-16: this brief builds `paid → shipped` only; `won → paid` is T-052.4 (active again, D-058).

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
UNPARKED 2026-11-17 (D-058). Active. Off-platform payment: the farmer marks the lot paid, then ships.

## Acceptance criteria
- AC1 (paid half): `won → paid`, in order only.
- AC4: a suspended farm may still mark its own sold lots paid; a terminated farm can't (403) (D-054).

## Decisions in force
plan "Lot lifecycle"; CLAUDE.md §8 explicit transitions. D-058: the winner pays the farmer directly, off-platform;
this route moves the lot `won → paid` and moves no money (no wallet read, no ledger row, no payout). D-003: seller
from req.seller_context. D-054: no validateSellerOpenStep; ownership (404) + status !== TERMINATED (403).
D-055: Indonesian messages.

## Build
- Same file as T-052.1: markLotPaidWorkflow({ seller_id, lot_id }): lock `lot:<id>` → same guard step, from-status
  `won` → setLotFieldsStep({ status: "paid" }) → release. Reuse T-052.1's guard step and row mapper.
- Route POST /vendor/sold-lots/:id/paid, no body (strict empty body as store/auctions/[id]/join/route.ts:45-51).
  bun run codegen.

## Spec (sold-lots.spec.ts, describe "paid")
- won → paid → 200, status paid; won → shipped → 409; paid twice → 409; another seller's lot → 404
- suspended seller → 200; terminated → 403 (D-054)
- no money moves: no `wallet_transaction` row written and both wallets' summed balances unchanged (D-058)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen; bun run test:integration:http -- sold-lots → pass (alone)
Report: standard header + API contract.

## Open questions
none
```

```text
Story: US-052 (task T-052.2)   Release: mvp
Agent: frontend (apps/storefront-koi)   Expected: <=40 min
Starts after: T-052.4 contract (paid); the shipped half (T-052.1) is already built on US-051 T-051.2b's page.

## Acceptance criteria
- AC1: `won → paid → shipped`, in order only.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- AC3: While shipping, the farmer sees the winner's name and masked address (D-056, US-051); no winner phone, masked or full, and no reveal from this story (D-052). *(Changed 2026-11-16: was "phone masked, full through US-051's reveal".)*

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET  | /vendor/sold-lots | after T-051.1b | rows incl. status, auction.delivery_method, tracking_number (T-052.1), winner.name (no phone, D-052) |
| POST | /vendor/sold-lots/:id/paid | after T-052.4 | no body → { lot } ; 409 wrong status |
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
Verify AC1–AC4 (AC1's `won → paid` half included, re-opened by D-058). Decisions: plan "Lot lifecycle", "Delivery", D-039, D-042, D-052, D-054, D-058.
Commands (alone): bun run test:integration:http -- sold-lots; bun run check in apps/storefront-koi.
Watch for: any skipped or backward transition; courier shipped without tracking; another seller's lot changing; any
winner phone (masked or full) in the list or page source; winner_customer_id/final_price changed; the paid/shipped
workflows using validateSellerOpenStep (would lock out a suspended farm, D-054); a terminated farm let through; the
paid route moving money — any wallet read, ledger row or balance change (D-058).
Browser: render-check /akun/kebun/terjual as the farmer, walk won → paid → shipped.
```

### US-053 Winner marks delivered · `done (evidence: packages/api/integration-tests/http/won-lot-delivered.spec.ts (6/6); packages/api/src/workflows/mark-lot-delivered.ts:23-53 (winner only 34-36 → 404, shipped only 37-43 → 409, delivered_at saved 47-51), :58-78 (lock lot:<id>); packages/api/src/api/store/won-lots/[id]/delivered/route.ts:16-52 (identity from auth_context, strict empty body); apps/storefront-koi/src/lib/data/lots.ts:201-210; components/sections/LotDetailsPage/components/WonLotPanel.tsx:88 (deliver button, shipped only), wired from LotPage.tsx:274 via LotDossier.tsx:40; packages/api tsc exit 0; storefront bun run check exit 0 (182 tests); browser delivered-after.png, /tmp/koi-render/recheck1/; qa PASS fix round 1)`
As a **winner**, I want to mark the fish delivered so that the sale completes and
the claim window starts. *(Plan: Delivery)*
- AC1: Only the winner can mark `shipped → delivered`.
- [x] T-053.1 [backend] `lot.delivered_at` + delivered workflow + `POST /store/won-lots/:id/delivered`
- [x] T-053.2 [storefront] Button on the won lot *(unblocked 2026-11-16, D-052; starts after US-051 T-051.7, its page now that T-051.2a is parked)*
- [x] T-053.3 [qa] Only the winner, only from `shipped`; `delivered_at` saved *(new task 2026-11-16: the story had no qa task)*

**Readiness (2026-11-16; accepted 2026-11-17): `todo`; T-053.1 ready, T-053.2 ready after US-051 T-051.7 (mvp-Q34 → D-052; T-051.2a is
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

### US-054 Winner opens a dead-on-arrival claim · `done (evidence: packages/api/src/modules/moderation/models/claim.ts:4-11,26-44 (enum, remedy, unique lot_id); packages/api/src/workflows/open-claim.ts:35-72 + steps/claim.ts:52-113 (window from settings, delivered-only, 409s, guards before upload), :127-149 (insert, 23505 → 409, compensating delete); packages/api/src/api/store/won-lots/[id]/claims/route.ts:33-40 (zero-byte 400), :42-64 (responds without the key); packages/api/src/api/middlewares.ts:127-145 (video-only multer, 100 MB), :345-358 (auth before parse); packages/api/src/api/store/won-lots/route.ts:130-181 (claim_window_ends_at + own claim, one query); packages/api/src/api/vendor/claims/route.ts:19-36, packages/api/src/api/admin/claims/route.ts:31-74 (status default open, seller name, masked); packages/api/src/api/utils/private-image.ts:12-17,76-82 (video types, private/no-store); packages/api/integration-tests/http/won-lot-claims.spec.ts:200,211,266-288,290,318 (9/9); claims-read.spec.ts:347,489,525-526 (15/15 re-check, 9/9); storefront WonLotPanel.tsx:94-95,219 + lib/helpers/claim.ts:31-46; WonLotsPage.tsx:155-170; SoldLotsPage.tsx:191-210 + ClaimVideo.tsx:17-40; admin-koi ClaimQueue.tsx + lib/helpers/claim-format.ts:12-14; next.config.ts:14-25 (110mb); packages/api tsc + test:unit 17/17 + test:integration:modules 10/10; storefront check 198/198; admin-koi check 33/33; render checks clean; qa PASS fix round 1)`
As a **winner**, I want to claim within 4 hours if the fish arrives dead or sick
so that I get a refund or a replacement. *(Plan: Dead-on-arrival claims 1–3, Design rules; D-025, D-027)*
- AC1: A claim is allowed only within the claim window (4 h, a setting) after delivered.
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
- AC4: A new claim has status `open`. The claim enum is `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038).
- [x] T-054.1 [backend] `claim` model in a new Moderation module (D-038 enum, remedy, video key) + migration
- [x] T-054.1a [backend] Open-claim workflow (window from `claim_window_hours`, delivered only, video then row) + `POST /store/won-lots/:id/claims` with the 100 MB multer entry
- [x] T-054.1b [backend] Read routes: winner's `claim` + `claim_window_ends_at` on the won-lot rows, `GET /vendor/claims`, `GET /admin/claims`, and the two private video routes (`/vendor/claims/:id/video`, `/admin/claims/:id/video`)
- [x] T-054.2a [storefront] Claim form on the won lot page: remedy + video (100 MB), window shown from `GET /store/won-lots/:id`
- [x] T-054.2b [storefront] Winner's claim state on `/akun/menang` rows ("Klaim diajukan" badge, row label)
- [x] T-054.2c [storefront] Farmer sees claims on `/akun/kebun/terjual` (own lots only, video via a member-token read route)
- [x] T-054.4 [admin] `/klaim` queue lists open claims
- [x] T-054.3 [qa] Late claims and oversized videos are rejected on the server; a new claim is `open` and shows in the Farmer area and the admin queue

**Accepted 2026-11-17** (qa PASS on AC1–AC4, fix round 1). Two bugs fixed in round 1: a zero-byte video now 400 with no row and no file (`claims/[id]/claims/route.ts:35-40`, spec `won-lot-claims.spec.ts:266-288`), and the admin claim labels now match D-027/D-038 (`resolved` → "Menunggu konfirmasi", `confirmed` → "Selesai", `claim-format.ts:12-14`). Open, non-blocking: **mvp-Q44** — one claim per lot whatever its status is shipped and kept (option a; unique index on `claim.lot_id`), US-055 changes it only if the owner picks (b); **mvp-Q45** — a suspended farm's decision path, which blocks nothing here and only shapes US-055 T-055.1a.

**Readiness (2026-11-17): ready (`todo`). Nothing decided is missing; no owner question blocks it.**
Checked: plan "Dead-on-arrival claims" 1–3 and "Design rules"; D-025 (on-site only), D-027
(closed = `confirmed`/`rejected`; enum superseded), D-038 (enum `open → approved | disputed`,
`disputed → approved | rejected`, `approved → resolved → confirmed`), D-002 (admin screens
only in `admin-koi`), D-018/D-040 (private uploads outside `static/`, store routes never
return a key or URL), D-039/D-042/D-045/D-052 (no phone either way, admins masked),
D-054 (farmer action on own sold lots checks ownership + not `terminated`), D-055
(Indonesian messages), plan Settings (D-010: `claim_window_hours` in the settings table;
already read/writable at `packages/api/src/api/admin/settings/route.ts:32-33`,
`apps/admin-koi/src/components/SettingsForm.tsx:122`).
- **The claim window is enforced on the open-claim route only; there is no job.** A window
  that has closed is a 409 on POST, nothing scans for missed windows, and no status is
  moved by a timer in this story (US-055/US-056 own the later states; US-061 the cleanup).
- **Payment model parked (2026-11-16).** No in-app route reaches `paid` (T-052.4) or
  `delivered` except US-053, so specs and qa must seed a `paid`/`delivered` lot directly:
  create `auction` + `lot` through `AuctionModuleService` the way
  `packages/api/integration-tests/http/won-lot-delivered.spec.ts:81-113` does, and for the
  browser set `status='delivered', delivered_at=now()` with `psql` (or the module service)
  on seeded rows. **Do not add a mark-paid or mark-delivered test route.** Today's dev DB
  already has the seed shape: `lot_01M7HJP86Y1H1MC28B4HJK3J2F` is `won` by budi
  (`cus_01M6V7FMYJDQ3DC4J4ZYQ5S09X`) on Sakura's closed auction — one `psql` update makes
  it the render-check lot; check the ids before using them, they are not stable.
- **No money in this story.** Refund and replacement are US-056 (parked); the remedy is a
  saved choice string only. No ledger row, no wallet read, no balance.
- **Video storage:** File Module, `access: "private"` (local provider → `private-uploads/`,
  `packages/api/medusa-config.ts:111-126`), so claim videos are private like KTP (D-017).
  Production private storage is `T-090.3`, launch-only.
- **Farmer video access needs a route pair.** D-018's "never a key or URL" means the
  farmer's list returns `has_video: true`, and the bytes come from an authenticated
  member-token route. It is a read route on a sold lot, so it checks ownership +
  `assertSellerNotTerminated` (D-054), not `validateSellerOpenStep`.
- **No queue count / notification table.** "Notified" (AC3) = the claim exists in both
  queues; no message table, no email, no WhatsApp (D-025).
- **`mvp-Q44` raised (owner, non-blocking for this story).** The plan says nothing about a
  second claim on the same lot. US-054 ships with "one claim per lot, whatever its
  status": a unique index on `claim.lot_id` plus a 409 in the workflow. Nothing in US-054
  can move a claim to `rejected` — US-055 does. If the owner later wants "the winner may
  open a new claim after a rejection", US-055 changes its guard and drops that unique
  index (a one-line migration); no AC of this story reopens.

#### Endpoint inventory

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | `/store/won-lots/:id/claims` | no | T-054.1a. multipart: `video` (File, ≤100 MB, MP4/WebM/QuickTime), `remedy` (`refund`\|`replacement`). 201 `{ claim: { id, lot_id, status, remedy, opened_at } }`; 400 invalid remedy/video/type/size (Indonesian message preserved); 404 not the winner; 409 for window closed, lot not `delivered`, or a claim already exists (Medusa rewrites the 409 body — the app renders its own copy and refreshes; D-055) |
| GET | `/store/won-lots/:id` | yes | `packages/api/src/api/store/won-lots/[id]/route.ts`. **Extend** each `WonLot` row with `claim_window_ends_at: string \| null` and `claim: { id, status, remedy, opened_at, has_video } \| null` (the caller's own claim on that lot). Keep every existing field. Apply the same two fields to `GET /store/won-lots` rows through the shared `toWonLot`. No separate winner claims route: the row carries it |
| GET | `/vendor/claims` | no | T-054.1b. Farmer's own claims, newest first: `{ claims: [{ id, lot_id, status, remedy, opened_at, has_video, winner: { name }, product: { title, thumbnail } }], count, limit, offset }`. No phone, no street address, no customer id (D-052/D-045) |
| GET | `/vendor/claims/:id/video` | no | T-054.1b. Raw bytes of the private file, member token + `x-seller-id`; ownership + not `terminated` (D-054); 404 otherwise. Mirrors `src/api/admin/topup-requests/[id]/screenshot/route.ts` |
| GET | `/admin/claims` | no | T-054.1b. Open claims queue: `{ claims: [{ id, lot_id, status, remedy, opened_at, has_video, winner: { name }, seller: { name }, product: { title, thumbnail } }], count, limit, offset }`, `status` filter defaulting to `open`. Masked PII only (D-042) |
| GET | `/admin/claims/:id/video` | no | T-054.1b. Raw bytes, admin token; `/admin/*` is admin-authenticated by default (D-002) |

Every "no" row is a backend task in this story, ordered before the screen that reads it.
No frontend task starts before its route exists and `bun run codegen` has run.

#### Briefs (run order)

T-054.1 → T-054.1a → T-054.1b → T-054.2a/T-054.2b (storefront, one agent) or
T-054.4 (admin-koi, parallel) → T-054.2c (storefront, after T-054.1b) → T-054.3.
One backend agent at a time; qa starts only when no backend or qa Jest run is active.

```text
Story: US-054 (task T-054.1)   Release: mvp
Agent: backend   Expected: <=35 min

## Acceptance criteria
- AC4: A new claim has status `open`. The claim enum is `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038).
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.
  (this task: the video key and remedy columns only)

## Decisions in force
D-038: the status enum exactly as written; no `accepted`. Plan "Custom modules" Moderation
row: `claim` (lot, video, remedy, status, farmer and admin decisions). No money column of
any kind (US-056 parked). D-018/D-017: video is a private file, stored as a provider key.

## Build
New module src/modules/moderation/ (index.ts exporting MODERATION_MODULE = "moderation",
service.ts MedusaService({ Claim }), models/claim.ts, migrations/). Register in
medusa-config.ts after the pii-audit entry. One model, no service methods yet:
- id (prefix "claim"), lot_id (text, soft reference — no FK into the auction module),
  customer_id (text, the winner who opened it), seller_id (text, the farmer owning the lot,
  saved at open so a list filters by it without walking links),
  remedy enum ["refund","replacement"], status enum
  ["open","approved","disputed","rejected","resolved","confirmed"] default "open",
  video_file_key text (not null). No `opened_at` column: the row's own `created_at` is the
  open time, and every response maps it to `opened_at` (same value, one column fewer).
  Later states (US-055/US-056) add their own timestamps to this table, not to `lot`.
- Indexes: `lot_id` **unique** (one claim per lot — the DB is the guard against two
  simultaneous POSTs, with the workflow's check as the friendly 409), [seller_id, status],
  [customer_id]. Named checks only if you add one (DML emits duplicate names otherwise,
  see src/modules/auction/models/lot.ts).
- Migration via `medusa db:generate moderation` (DATABASE_URL=…koi-store?sslmode=disable).
  Do not add columns to `lot`; the later states add no column here.

## Start from
- packages/api/src/modules/pii-audit/{index.ts,service.ts,models/*}
- packages/api/src/modules/auction/models/lot.ts (named enum, soft refs)
- packages/api/medusa-config.ts:60-68 (module registration)

## Do not touch
- src/api/**; src/workflows/**; src/links/**; apps/**; any existing module

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun x medusa db:generate moderation → migration created (list it)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the model's fields/enums.

## Open questions
none
```

```text
Story: US-054 (task T-054.1a)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: T-054.1 (moderation module exists).

## Acceptance criteria
- AC1: A claim is allowed only within the claim window (4 h, a setting) after delivered.
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.
- AC4: A new claim has status `open`. The claim enum is `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038).

## Decisions in force
Plan "Dead-on-arrival claims" 1–2; D-010 (setting from the table, not env);
D-018/D-040 (private upload, no key or URL in any response);
D-055 (Indonesian messages); CLAUDE.md §8 (workflow with compensation, save the result
when the action happens). The window counts from `lot.delivered_at` (US-053).

## Build
- validators.ts in src/api/store/won-lots/[id]/claims/:
  CLAIM_VIDEO_MIME_TYPES = ["video/mp4","video/webm","video/quicktime"] (AC2 says video;
  an image is not accepted) and CLAIM_VIDEO_MAX_BYTES = 100 * 1024 * 1024. Body zod:
  remedy z.enum(["refund","replacement"]); multipart sends text, so no coercion needed.
  Type StoreCreateClaimInput = { remedy } & { video: Blob }, like
  src/api/store/topup-requests/validators.ts:29-31.
- middlewares.ts: claimVideoUpload = multer({ storage: memoryStorage(),
  limits: { fileSize: CLAIM_VIDEO_MAX_BYTES, files: 1 }, fileFilter: type in list });
  reuse clientErrorsAsBadRequest (:88-104) so a big file is 400, not 500. Entry:
  POST /store/won-lots/:id/claims → [authenticate("customer",["bearer","session"]),
  parseClaimVideo, validateAndTransformBody(StoreCreateClaimBody)] — auth before parsing.
- Workflow src/workflows/open-claim.ts openClaimWorkflow({ customer_id, lot_id,
  remedy, video: { filename, mimeType, content(base64) } }):
  lock `lot:<id>` → readClaimedLotStep (read only): lot missing or
  winner_customer_id !== customer_id → 404 "Lot tidak ditemukan."; status !== "delivered"
  or delivered_at is null → CONFLICT "Klaim hanya untuk lot yang sudah diterima." (409;
  the app keys on status, D-055); now > delivered_at + claim_window_hours → CONFLICT
  "Batas waktu klaim sudah lewat." Read claim_window_hours with the settings read pattern in
  src/workflows/steps/auction.ts:20-50 (getAuctionSettingsStep), falling back to
  PLATFORM_SETTING_DEFAULTS.claim_window_hours (4). Also refuse a second claim: any
  existing claim for that lot, whatever its status, → CONFLICT "Lot ini sudah punya
  klaim." (one claim per lot; see readiness `mvp-Q44`) → uploadFilesStep({ files: [{ filename:
  `unboxing.${ext}`, mimeType, content, access: "private" }] }) (copy
  src/workflows/create-topup-request.ts:46-52) → createClaimStep (one
  moderation.claim row per lot; compensation deletes it) → release. The upload's own
  compensation deletes the file when the insert fails: wrap the row step in a
  fail-if-exists guard the same shape as createTopupRequestStep.
- Route POST: req.file required (else 400 "Video unboxing wajib diunggah."), content:
  file.buffer.toString("base64"), res 201 with { claim: { id, lot_id, status, remedy,
  opened_at } }. Never return video_file_key (D-018).
- No job, no scheduler change (US-056/US-061 own later states).

## Start from
- packages/api/src/workflows/create-topup-request.ts (upload + compensating insert)
- packages/api/src/api/store/topup-requests/route.ts:36-110 (multer + route)
- packages/api/src/api/store/won-lots/[id]/delivered/route.ts (winner-only, thin)
- packages/api/src/workflows/mark-lot-delivered.ts:23-78 (lock + guard + compensation)

## Do not touch
- apps/**; src/modules/auction/**; src/api/vendor/**; src/api/admin/**; T-054.1's model
  beyond what this task needs (no new column without a migration)

## Spec (packages/api/integration-tests/http/won-lot-claims.spec.ts)
Seed a `delivered` lot per T-054.1 readiness (module service, not a route).
- winner, delivered 1 h ago, valid video + remedy refund → 201, status open,
  opened_at ≈ now, exactly one claim row, one private file
- delivered 5 h ago → 409, no row, no file; a settings row with claim_window_hours: 8
  → same lot 201 (proves the setting is read)
- another customer → 404; anonymous → 401; lot still `shipped`/`won` → 409
- remedy "cash" → 400; no file → 400; 101 MB file → 400; a .jpg upload → 400
- second claim on the same lot → 409, still one row
- forced failure after the upload → no claim row and the file is gone

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- won-lot-claims → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (method, path, multipart fields, response, errors).

## Open questions
none
```

```text
Story: US-054 (task T-054.1b)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: T-054.1a (claims can exist).

## Acceptance criteria
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
- AC1 (visibility of the window): the winner's lot row carries when the window ends (supports AC1's UI half on the lot page).

## Decisions in force
D-002 (admin screens read /admin/* only), D-018/D-040 (bytes only through an
authenticated route; lists carry has_video, never a key or URL), D-042 (admin sees masked
PII; this story's admin list shows the winner's NAME only and no phone/address at all —
nothing to mask), D-045, D-052 (no phone either way), D-054 (farmer read on own sold
lots: ownership + assertSellerNotTerminated, NOT validateSellerOpenStep), D-055.

## Build (all reads use query.graph; no workflow)
Every `opened_at` in a response is the claim row's `created_at`, ISO-serialised.
- Extend the shared `toWonLot` mapper (GET /store/won-lots and /store/won-lots/:id):
  claim_window_ends_at = delivered_at + claim_window_hours (ISO; null unless status is
  `delivered` and delivered_at set) and `claim` = the caller's own claim on that lot as
  { id, status, remedy, opened_at, has_video } | null (latest row if several; the POST
  allows one). Read both with one extra query over the page's lot ids, not per row; no
  file key ever selected. Keep every existing field. Share the settings read with
  T-054.1a's step, don't copy it.
- GET /vendor/claims: as the inventory shows. seller_id filter, optional status filter,
  order opened_at DESC, limit/offset (Zod default 20 max 100, copy
  src/api/vendor/sold-lots/validators.ts). Each row adds product { title, thumbnail } via
  the lot → product link and winner { name } from the customer (first_name + last_name,
  the winnersById pattern in src/api/vendor/sold-lots/route.ts:61-112 — no phone, no
  address field selected). Add `import "../../../types/seller-context"` (the file reads
  req.seller_context). Call assertSellerNotTerminated (D-054).
- GET /admin/claims: same row + seller { name }; status filter default "open"; order
  opened_at ASC (arrival order, like src/api/admin/auctions/route.ts:103).
- GET /vendor/claims/:id/video and GET /admin/claims/:id/video: look the claim up,
  check ownership (vendor) or admin default, then send the bytes. Copy
  src/api/utils/private-image.ts but extend the CONTENT type map with mp4/webm/mov
  (video/mp4, video/webm, video/quicktime) and keep non-listed types as an attachment.
  Rename nothing existing; add a sibling helper or parameterise sendPrivateImage.
- middlewares.ts: no new entry for the won-lot GETs (they exist). Vendor GET
  /vendor/claims with validateAndTransformQuery (Mercur's /vendor catch-all
  authenticates the member); admin GET /admin/claims with validateAndTransformQuery. No
  body middleware on the two video routes.
- bun run codegen (all the screens read these).

## Start from
- packages/api/src/api/store/won-lots/{route.ts,[id]/route.ts} (toWonLot)
- packages/api/src/api/vendor/sold-lots/route.ts:61-112 (winner name, one query)
- packages/api/src/api/admin/topup-requests/route.ts (admin list shape/pagination)
- packages/api/src/api/admin/topup-requests/[id]/screenshot/route.ts + utils/private-image.ts

## Do not touch
- apps/**; the open-claim workflow; lot model columns; wallet/ledger

## Spec (packages/api/integration-tests/http/claims-read.spec.ts)
- won-lot row carries `claim` (status open, has_video true) and claim_window_ends_at =
  delivered_at + 4 h; another customer's lot → 404; anonymous → 401
- farmer sees only own sold lots' claims; another farm's claim absent; terminated farm →
  403; suspended farm → 200 (D-054)
- admin list defaults to `open`; a disputed claim is absent by default and present with
  ?status=disputed
- no response anywhere contains a video key, a URL, a customer id or a phone (assert on
  serialised JSON, like integration-tests/http/pii-leaks.spec.ts)
- video routes: owner 200 with video/mp4 and private,no-store; other farm 404; customer
  token on /admin/claims/:id/video → 401/403
- claim_window_ends_at is null on a `shipped` lot

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean; bun run codegen
cd packages/api && bun run test:integration:http -- claims-read won-lots → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + every response shape above, verbatim.

## Open questions
none
```

```text
Story: US-054 (task T-054.2a)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=40 min
Starts after: T-054.1b (routes and codegen exist).

## Acceptance criteria
- AC1: A claim is allowed only within the claim window (4 h, a setting) after delivered.
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.

## Decisions in force
D-052 (the form shows no farmer contact), D-055 (server messages shown verbatim; 409
copy written in the app), D-002/D-004 (storefront only).

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /store/won-lots/:id | yes | lot.claim_window_ends_at: string\|null, lot.claim: { id, status, remedy, opened_at, has_video }\|null + existing row (T-054.1b) |
| POST | /store/won-lots/:id/claims | yes (T-054.1a) | multipart { video, remedy } → 201 { claim: { id, lot_id, status, remedy, opened_at } } |

## Build (one surface: the claim form)
- src/lib/helpers/claim.ts (pure, + .test.ts): claimWindowInfo(endsAt, now) →
  { open: boolean; label: string } ("Sisa waktu klaim: 3 jam 12 menit" / "Batas waktu
  klaim sudah lewat"), remedyLabel('refund'|'replacement'), claimFailureInfo({status,
  code, message}) → 409 → "Status lot atau klaim sudah berubah. Halaman diperbarui." with
  refresh true (all three 409 reasons share Medusa's rewritten body, so the copy is
  generic; the form's own pre-check already covers the ordinary cases), 404 → "Lot ini
  bukan lot yang Anda menangkan." with refresh true, 400 → the server's message. Mirror
  won-lot.ts:38-53.
  Video cap 100 * 1024 * 1024 and the accepted type list live here too (display only; the
  server decides).
- src/lib/data/lots.ts (extend, don't create a new file): openClaim(lotId, remedy, file)
  using the client path `bun run codegen` produced for POST /store/won-lots/:id/claims —
  read `.mercur/routes.d.ts` / `packages/api/.mercur` and use the exact name (expected
  shape `sdk.store.wonLots.$id.claims.mutate({ $id, remedy, video: file, fetchOptions })`;
  if codegen named it differently, fix the call, never the route).
  @mercurjs/client turns a payload holding a File into multipart itself (topups.ts:88-99).
  Return { success } | { message, code, status }.
- WonLotPanel.tsx: when status === 'delivered', claim is null and the window is open,
  draw an "Ajukan klaim" form: remedy radio (Pengembalian dana / Ikan pengganti), a file
  input accepting video/mp4,video/webm,video/quicktime, a client-side >100 MB warning,
  submit disabled while busy, a result toast + router.refresh(). When `claim` exists,
  draw "Klaim diajukan" (status label) and no form. When the window closed, draw the
  closed line and no form. Past `claim_window_ends_at` the form hides itself (AC1 in the
  UI; the server is the guard).
- Thread the two new fields through LotPage.tsx's getWonLot mapping (:270-310) and
  WonLotPanel's props.
- **Next body limit.** The upload goes through a server action, and
  `apps/storefront-koi/next.config.ts:14-22` caps it at 40 MB (set for farm photos). A
  100 MB video is refused before it reaches the API. Raise `bodySizeLimit` to `'110mb'`
  in the same file and say so in the report. This is the one config change; nothing else
  in next.config.ts.
- **Then the backend body limit.** Express's default `json`/`urlencoded` limit does not
  apply to a multer multipart body, but Medusa's own router sets `express.json({ limit:
  "1mb" })` for JSON only — multipart is streamed to multer, so no backend config change
  is expected. Do not raise any global body limit pre-emptively; if the render check's
  submit fails at ~1 MB, report it as a bug against T-054.1a with the exact response,
  don't patch around it.

## Start from
- apps/storefront-koi/src/components/sections/LotDetailsPage/components/WonLotPanel.tsx
  (:38-109 button + confirm + failure branch)
- apps/storefront-koi/src/lib/data/lots.ts:186-218 (getWonLot, markWonLotDelivered)
- apps/storefront-koi/src/lib/data/topups.ts:88-120 (File through the typed client)
- apps/storefront-koi/src/components/sections/AccountPage/components/ShipLot.tsx (form shape)

## Do not touch
- packages/api; apps/admin-koi; /akun/menang; /akun/kebun/terjual (T-054.2b/.2c)

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (render-check skill) on /lelang/<seeded delivered lot> as budi@koi.dev
(seeded delivered lot per readiness), incl. one real submit of a small mp4 → clean;
screenshots in /tmp/koi-render/
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-054 (task T-054.2b)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=35 min
Starts after: T-054.1b. Same agent as T-054.2a is fine if both fit one run; otherwise alone.

## Acceptance criteria
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
  (this task shows the winner that their own claim is filed)
- AC4: A new claim has status `open`. The claim enum is `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038).

## Decisions in force
D-055; D-046/D-051 (no winner identity leaks on public routes; this is the winner's own
account page, so their own row is theirs).

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /store/won-lots | yes | rows keep status `delivered`; the shared mapper gains `claim` (T-054.1b) |

## Build (one surface: the winner's lists)
- src/lib/helpers/won-lot.ts: wonLotStatusLabel gains an optional `claim` argument; for
  `delivered` with a claim it reads "Sudah diterima — klaim diajukan" (open) or the claim
  status label, otherwise as today. Keep the existing signature callable and testable;
  extend won-lot.test.ts.
- WonLotsPage.tsx (apps/storefront-koi/src/components/sections/AccountPage/WonLotsPage.tsx):
  a "Klaim diajukan" badge on rows whose `claim` is set, linking to the lot page. Change
  nothing else on the row.
- No status flip, no optimistic update: the row comes from the server (revalidatePath
  already on the claim submit in T-054.2a).

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/WonLotsPage.tsx:83-110
- apps/storefront-koi/src/lib/helpers/won-lot.ts (labels + failure info)

## Do not touch
- apps/admin-koi; packages/api; the lot page form (T-054.2a)

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check on /akun/menang as a winner with an open claim → clean
Report: standard header + render check result.

## Open questions
none
```

```text
Story: US-054 (task T-054.2c)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=45 min
Starts after: T-054.1b. Run after T-054.2a/.2b (one storefront agent at a time).

## Acceptance criteria
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
  (this task: the Farmer area half)

## Decisions in force
D-052/D-045 (the farmer sees the winner's NAME only — no phone, no street address),
D-054 (a suspended farm still sees its claims), D-055, D-018 (video bytes through the
member-token route, never a URL).

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /vendor/claims | yes (T-054.1b) | { claims: [{ id, lot_id, status, remedy, opened_at, has_video, winner: { name }, product: { title, thumbnail } }], count, limit, offset } |
| GET | /vendor/claims/:id/video | yes (T-054.1b) | raw bytes |
| GET | /store/won-lots | yes | unchanged |

## Build (one surface: the farmer's sold-lot list)
- src/lib/data/claims.ts (new, small): listVendorClaims(limit, offset) through the
  codegen-produced vendor client path for GET /vendor/claims (expected `sdk.vendor.claims`;
  check `.mercur/routes.d.ts` and use the exact name) with vendorHeaders(); getClaimVideo(id) returning base64 +
  contentType exactly like apps/admin-koi/src/lib/data/topups.ts:132-167 (Accept not
  JSON so @mercurjs/client hands back the Response). Base64 through the server action is
  fine for the MVP; no proxy or streaming layer.
- SoldLotsPage.tsx (/akun/kebun/terjual): for a row whose lot has claims, draw a
  "Klaim DOA" block under the existing row: status badge (open → "Klaim masuk", others
  labelled per claim status), remedy label, opened_at in Asia/Jakarta (existing
  shipping-date.ts style), the winner's name from the claim row, and a "Lihat video
  unboxing" button that loads the bytes on click and renders a blob URL in a <video>
  (revoke on unmount, copy ScreenshotView's lifecycle in TopupQueue.tsx:166-230).
  A lot with no claim renders exactly as today.
- Merge the two lists by lot_id; the sold-lots call stays the page's main read (one extra
  vendor read on the page, no per-row calls).
- Keep the claims inside /akun/kebun/terjual (AC3 says "the Farmer area"; this page is
  it). No new route, no nav change.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/SoldLotsPage.tsx:180-290
- apps/storefront-koi/src/lib/data/sold-lots.ts (vendorHeaders + { value }|{ error })
- apps/admin-koi/src/components/TopupQueue.tsx:158-230 (blob URL lifecycle)

## Do not touch
- packages/api; apps/admin-koi; the winner's screens

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check on /akun/kebun/terjual as sakura.koi.farm@koi.dev with a seeded claim on one
of its sold lots → clean; a row with no claim unchanged
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-054 (task T-054.4)   Release: mvp
Agent: frontend (admin-koi)   Expected: <=40 min
Starts after: T-054.1b. May run in parallel with the storefront tasks.

## Acceptance criteria
- AC3: The farmer and admin are notified on the site only: the claim appears in the Farmer area and in the admin-koi claim queue. No WhatsApp message is sent (D-025).
  (this task: the admin queue half)

## Decisions in force
D-002 (this app only), D-042 (masked PII; the queue shows the winner's name and the farm
name, no phone/address), D-018 (video bytes via the admin route), D-055.

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /admin/claims | yes (T-054.1b) | { claims: [{ id, lot_id, status, remedy, opened_at, has_video, winner: { name }, seller: { name }, product: { title, thumbnail } }], count, limit, offset } |
| GET | /admin/claims/:id/video | yes (T-054.1b) | raw bytes |

## Build (one surface: the open-claims queue)
- src/lib/data/claims.ts (new): every export calls requireAdmin(ROUTES.claims) first;
  listClaims(status = 'open', limit, offset) and getClaimVideo(id) → base64 + contentType
  through the codegen-produced admin client paths (check `packages/api/.mercur/routes.d.ts`
  for the exact names; expected `sdk.admin.claims` and
  `sdk.admin.claims.$id.video.query`), following apps/admin-koi/src/lib/data/topups.ts:132-167
  for the raw-Response read (Accept not JSON). Base64 in a server-action response is fine
  for the MVP; do not add a proxy route handler or a streaming layer for it.
- src/app/(app)/klaim/page.tsx (new route, matching ROUTES.claims '/klaim'): reuse the
  queue shape from FarmQueue.tsx (loading, empty, error, pagination) and TopupQueue.tsx's
  decision card layout, but read-only — no decision buttons (US-055 brings them). Each
  claim shows: product title, farm name, winner name, status badge, remedy label,
  opened_at Asia/Jakarta, "Lihat video unboxing" (blob URL in a <video>, revoke on
  unmount).
- src/const/nav.ts: the "Klaim DOA" item at :44-49 already points at ROUTES.claims with
  the right label — set its `ready: false` to `true`.
- Empty state text: "Belum ada klaim DOA."

## Start from
- apps/admin-koi/src/components/FarmQueue.tsx (queue shape)
- apps/admin-koi/src/components/TopupQueue.tsx:100-230 (card + private image lifecycle)
- apps/admin-koi/src/lib/data/topups.ts:1-60 (requireAdmin + list)

## Do not touch
- apps/storefront-koi; packages/api; US-055's decision actions

## Definition of done
cd apps/admin-koi && bun run check → pass
render check on http://127.0.0.1:3002/klaim as admin@koi.dev → clean; screenshots in
/tmp/koi-render/
Report: standard header + render check result + screenshot path.

## Open questions
none
```

```text
Story: US-054 (task T-054.3)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC4. Decisions: D-025, D-027, D-038, D-054, D-055, D-018/D-040, D-042.
Code under test: packages/api/src/modules/moderation/**,
src/workflows/open-claim.ts, src/api/store/won-lots/**, src/api/vendor/claims/**,
src/api/admin/claims/**, and the four screens.
Commands (alone): bun run test:integration:http -- won-lot-claims; then -- claims-read.
Then bun run check in both Koi apps.
Seeding: a `delivered` lot through the module service (won-lot-delivered.spec.ts:81-113);
for the browser, set status/delivered_at on a seeded lot with psql. Never call a mark-paid
or mark-delivered route — none exists and none may be added.
Browser (render-check): winner files a claim on the lot page; farmer sees it on
/akun/kebun/terjual with the video; admin sees it on /klaim.
Watch for: a claim outside 4 h accepted (try 5 h, and 8 h with claim_window_hours=8);
a >100 MB file reaching the workflow (expect 400, no file left in private-uploads/);
a second claim on the same lot; any response carrying video_file_key or a URL; another
winner's or farm's claim visible; a phone, customer id or street address in the farmer or
admin row; the farmer's video route served to another farm; a suspended farm blocked from
seeing claims (it must not be, D-054); money touched anywhere (it must not be);
dev-server file-watcher restart after an upload (a `curl 000` right after writing a file
is that, not a bug — retry once).
Do not change app code. Report PASS/FAIL per AC with file:line and command output; bugs
with repro and expected/actual.
```


### US-055 Farmer responds and admin decides disputes · `done (evidence: packages/api/src/modules/moderation/models/claim.ts:41-45 + migrations/Migration20261117153728.ts:5-11; packages/api/src/workflows/steps/claim.ts:130-153 (farmer guard, 404/409 claim_already_decided), :165-208 (decideClaimStep, approved_at + farmer_decided_at), :219-242 (admin guard, disputed only), :257-306 (decision_reason, decided_by, decided_at); packages/api/src/workflows/{accept,dispute,approve,reject}-claim.ts:24-47; packages/api/src/api/vendor/claims/[id]/{accept,dispute}/route.ts:54-70/:17-31; packages/api/src/api/admin/claims/[id]/{approve,reject}/route.ts:74-100/:18-44; packages/api/src/api/admin/claims/validators.ts:14-28; packages/api/src/api/middlewares.ts:558-569; packages/api/src/api/admin/claims/route.ts:19-23,82-103; integration-tests/http/won-lot-claim-farmer-decisions.spec.ts + won-lot-claim-admin-decisions.spec.ts 9/9 each; storefront lib/data/claims.ts:95-131 + lib/helpers/farm-claim.ts:46-60 + SoldLotsPage.tsx:209 + components/ClaimDecision.tsx:39-74; admin-koi ClaimQueue.tsx:59-60,135-140 + app/(app)/klaim/page.tsx:24-51; packages/api tsc clean; storefront check 202/202; admin-koi check 36/36; render checks clean; qa PASS)`
As a **farmer**, I want to accept or dispute a claim, and as an **admin**, I want
to decide disputes, so that claims are fair. *(Plan: Dead-on-arrival claims 3; D-038)*
- AC1: The farmer can accept, which moves the claim straight to `approved` with no admin step, or dispute (`open → disputed`) (D-038).
- AC2: Only a disputed claim goes to admin, whose decision (`approved` or `rejected`) is final and saved with a reason.
- [x] T-055.1a [backend] Farmer decision: `open → approved` (accept) and `open → disputed`, with the claim columns that save both decisions and `approved_at`
- [x] T-055.1b [backend] Admin dispute decision: `disputed → approved | rejected`, written reason required, saved with who decided
- [x] T-055.2 [storefront] Farmer area claim review with the video and the two decision buttons
- [x] T-055.3 [admin] `/klaim` dispute screen: disputed queue, approve or reject with a reason, decided tab
- [x] T-055.4 [qa] Farmer accept gives `approved` directly; admin can't decide a claim that isn't `disputed`
- [ ] T-055.5 [backend] D-060 guard swap on accept and dispute: ownership + not `terminated` instead of `validateSellerOpenStep`, so a farm suspended after approval can decide its own claims; terminated, `pending_approval` and a rejected registration still 403 *(new 2026-11-17, D-060 answers mvp-Q45 option b; the spec case at :369 changes from 403 to 200 for a suspended farm)*

**D-060 (2026-11-17) changes one expectation.** `mvp-Q45` is answered option (b):
a farm suspended after approval may accept or dispute a claim on its own sold
lot, because the admin only acts on `disputed` and a stranded `open` claim
punishes the winner. The shipped guard is `validateSellerOpenStep`
(`src/workflows/steps/validate-seller-open.ts:16`), so a suspended farm currently
gets 403 — that one case changes (T-055.5). Terminated, `pending_approval` and a
rejected registration still 403; ownership still returns 404 for another farm's
claim. AC1/AC2 wording is unchanged and still met.

**Accepted 2026-11-17** (qa PASS on AC1–AC2; the story has only AC1 and AC2).
AC1 proven: accept runs lock → `validateSellerOpenStep` → `getDecidableClaimStep`
(`status !== "open"` → 409 `claim_already_decided`) → `decideClaimStep` setting
`approved` + `approved_at` + `farmer_decided_at` on the server clock; dispute
sets `disputed` and leaves `approved_at` null (steps/claim.ts:165-208,
accept-claim.ts, dispute-claim.ts). No admin step is involved on the accept
path, and the farmer row carries no money and no video key (accept route
:37-52). AC2 proven: `getAdminDecidableClaimStep` refuses every status but
`disputed` with 409 `claim_not_disputed` and an unknown claim with 404
(steps/claim.ts:219-242), so a second decision is always 409; approve/reject
save `decision_reason`, `decided_by` (from `req.auth_context.actor_id`),
`decided_at`, and `approved_at` only on approve (:257-306); the reason is
trimmed and non-blank with the Indonesian 400 message
(validators.ts:14-28). qa's live probes agree: repeat accept 409, dispute after
accept 409, approve on approved 409, reject on rejected 409, another farm 404,
blank reason 400, 5 concurrent accepts → one 200 and four 409, `rejected` keeps
`approved_at` null, nothing reaches `resolved`/`confirmed`, no wallet row.
Two open questions stay **non-blocking**: **mvp-Q44** — one claim per lot
whatever its status (option a) is shipped and kept, so a rejected lot cannot be
claimed again; **mvp-Q45** — the strict D-054 reading is built, so a suspended,
pending or terminated farm gets 403 on accept and dispute (spec :369); option
(b) would be a two-line guard change. **Answered 2026-11-17 by D-060, option (b);
follow-up T-055.5.** **mvp-Q46** stays open too: no farmer note
on a dispute.

**Readiness (2026-11-17): accepted (`done`). No decided rule was missing; no owner question blocked it.**
Checked: plan "Dead-on-arrival claims" 3 ("the farmer can accept ... or dispute; on a
dispute, admin approves or rejects") and "Design rules" (claim statuses, D-055);
D-038 (enum and who decides what); D-027 (closed = `confirmed`/`rejected`, inline
in D-038); D-002 (admin screen only in `admin-koi`); D-042/D-045/D-052 (names only,
no phone); D-018/D-040 (video bytes only, never a key or URL); D-054 +
task-brief checklist (every custom `/vendor/*` mutation starts with
`validateSellerOpenStep`; the paid/shipped pair is the only exception).
- **Scope of the transitions.** This story moves a claim only `open → approved`,
  `open → disputed` (farmer) and `disputed → approved | rejected` (admin). Every
  other source status is a 409. `approved → resolved` and `resolved → confirmed`
  are US-056 (in scope again, D-058); US-055 has **no route, no column and no timer** that
  reaches `resolved` or `confirmed`, and nothing moves on a clock. The 3-day
  resolution clock and the auto-confirm job are US-056 T-056.1; the strike is
  US-059 (in scope again, D-058). No job or scheduler entry changes in this story.
- **Decision is final (AC2).** A second decision on the same claim — the same one
  again, or the other one — is 409, never 200: the guard is `status` under the
  `claim:<id>` lock. Medusa rewrites a 409 body, so apps key on the status and
  refresh; the app writes its own copy (D-055).
- **New columns (T-055.1a's migration only; T-055.1b adds none).** `approved_at`
  (nullable, set by farmer accept **and** admin approve — US-056's clock starts
  here), `farmer_decided_at` (nullable, accept or dispute), `decided_by`
  (nullable, admin user id), `decided_at` (nullable, admin decision time),
  `decision_reason` (nullable, the admin's written reason). The plan's Moderation
  row already carries "farmer and admin decisions"; no money column, no amount.
- **Legal transitions, and what the others return.** Every row below is checked
  under the `claim:<id>` lock and before any write; the step returns 404 for an
  unknown claim or (farmer routes) another farm's claim, and 409 for an illegal
  source status. A repeat of the same call is always 409.

  | Route | From | To | Saves |
  |---|---|---|---|
  | POST /vendor/claims/:id/accept | `open` | `approved` | `approved_at`, `farmer_decided_at` |
  | POST /vendor/claims/:id/dispute | `open` | `disputed` | `farmer_decided_at` (approved_at stays null) |
  | POST /admin/claims/:id/approve | `disputed` | `approved` | `approved_at`, `decided_by`, `decided_at`, `decision_reason` |
  | POST /admin/claims/:id/reject | `disputed` | `rejected` | `decided_by`, `decided_at`, `decision_reason` (approved_at stays null) |

  From `approved`, `rejected`, `resolved`, `confirmed` every one of the four
  routes is 409 `claim_already_decided` / `claim_not_disputed`; from `open` the
  two admin routes are 409 `claim_not_disputed`; from `disputed` the two farmer
  routes are 409 `claim_already_decided`. `resolved` and `confirmed` are never
  reachable in this story (US-056).
- **Closed now vs. later.** D-027/D-038 call a claim closed when it is
  `confirmed` or `rejected`, and "closed" gates the 30-day video deletion
  (US-061). So a claim this story rejects is closed at the moment of the
  rejection: **no timer is involved for it** — the timer US-056/US-061 own is
  the one after `resolved`. US-055 itself deletes no video and adds no cleanup
  job; US-061 reads the closed statuses later.
- **No money (D-058: the farmer settles off-platform).** Refund and replacement are US-056. No
  ledger row, no wallet read, no balance, no amount in any request or response.
- **`mvp-Q44` still open, non-blocking, and unchanged.** This story reaches
  `rejected`; option (a) stays as shipped — one claim per lot whatever its
  status, so a rejected lot cannot be claimed again (the existing 409 in
  `open-claim.ts`). Option (b) would be a follow-up (drop the unique index,
  widen the open-claim guard); no AC here reopens.
- **Owner questions raised by this section (not in the questions table):**
  `mvp-Q45` — **answered 2026-11-17 by D-060, option (b):** a farm suspended after
  approval may accept or dispute on its own sold lot (ownership + not `terminated`);
  follow-up T-055.5 swaps the guard. This story as shipped followed D-054's literal
  text (403 for a suspended farm). `mvp-Q46` —
  AC2 requires a written reason from the admin; the plan says nothing about the
  farmer's dispute carrying a note. This story ships without one (the admin
  judges from the video and the claim facts). Options: (a) no farmer note (what
  this story builds); (b) an optional farmer note, a new nullable column shown in
  the admin row. Both are non-blocking.

#### Endpoint inventory

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | `/vendor/claims` | yes (T-054.1b) | unchanged row; `?status=` already filters (open, disputed, approved, rejected) |
| GET | `/vendor/claims/:id/video` | yes (T-054.1b) | unchanged: raw bytes, member token + `x-seller-id`, ownership + not `terminated` |
| POST | `/vendor/claims/:id/accept` | no | T-055.1a. No body. 200 `{ claim: { id, lot_id, status: "approved", remedy, opened_at, approved_at, farmer_decided_at, decision_reason: null } }`; 403 `validateSellerOpenStep` message; 404 `"Klaim tidak ditemukan."` (not the caller's claim); 409 `claim_already_decided` (status not `open`; Medusa rewrites the body) |
| POST | `/vendor/claims/:id/dispute` | no | T-055.1a. No body. Same 200 shape with `status: "disputed"`, `approved_at: null`; same 403/404/409 |
| GET | `/admin/claims` | yes (T-054.1b) | T-055.1b **extends** each row with `decision_reason: string \| null`, `decided_at: string \| null`. `?status=` already accepts every enum value; `disputed`, `approved`, `rejected` now occur |
| GET | `/admin/claims/:id/video` | yes (T-054.1b) | unchanged |
| POST | `/admin/claims/:id/approve` | no | T-055.1b. Body `{ reason: string }` (trim, min 1). 200 `{ claim: { id, lot_id, status: "approved", remedy, opened_at, approved_at, farmer_decided_at, decision_reason, decided_by, decided_at } }`; 400 blank reason (Indonesian message); 404 `"Klaim tidak ditemukan."`; 409 `claim_not_disputed` (status not `disputed`) |
| POST | `/admin/claims/:id/reject` | no | T-055.1b. Body `{ reason }`. Same shape with `status: "rejected"`, `approved_at: null`; same 400/404/409 |

No `GET /store/won-lots*` change: the winner's row already carries `claim.status`
and the labels for `disputed`, `approved` and `rejected` exist
(`lib/helpers/claim.ts:61-77`). The admin's reason is saved, not returned to the
winner (AC2 asks for it to be saved; nothing asks for it to be shown).

#### Briefs (run order)

T-055.1a → T-055.1b → T-055.2 (storefront) ‖ T-055.3 (admin-koi) → T-055.4.
One backend agent at a time; codegen runs in each backend task before its screen
starts; qa starts only when no other Jest run is active.

```text
Story: US-055 (task T-055.1a)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-054 T-054.1b (GET /vendor/claims and the claim row exist).

## Acceptance criteria
- AC1: The farmer can accept, which moves the claim straight to `approved` with no admin step, or dispute (`open → disputed`) (D-038).

## Decisions in force
D-038: the farmer's two moves only from `open`; no `accepted` state; the admin
decides only disputes (T-055.1b). D-054 + task-brief checklist: the accept and
dispute routes are custom `/vendor/*` mutations, so the workflow starts with
`validateSellerOpenStep` (the paid/shipped pair is the ONLY exception; see
mvp-Q45, later answered by D-060/T-055.5). D-055: Indonesian messages. CLAUDE.md §8: workflow with compensation;
save the result when the action happens; identity from `req.seller_context`.

## Build
- Model (src/modules/moderation/models/claim.ts): add nullable
  `approved_at` (dateTime), `farmer_decided_at` (dateTime), `decided_by` (text),
  `decided_at` (dateTime), `decision_reason` (text). No enum change, no index
  change. Migration: edit the model, then
  `DATABASE_URL=…koi-store?sslmode=disable bun x medusa db:generate moderation`;
  exactly one new migration, list it. T-055.1b adds no column.
- src/workflows/steps/claim.ts (extend, don't rewrite): one read-only guard step
  `getDecidableClaimStep({ claim_id, seller_id })`, run under the
  `claim:<id>` lock: claim missing or `claim.seller_id !== seller_id` → NOT_FOUND
  "Klaim tidak ditemukan."; `claim.status !== "open"` → CONFLICT
  "Klaim ini sudah diputuskan." with code `claim_already_decided` (409). One
  mutation step `decideClaimStep({ claim_id, status, farmer_decided_at })`:
  `updateClaims` with the new status; on `approved` also `approved_at` (the
  server's `new Date()`, set in the step, not the route); compensation restores
  exactly the fields it changed (copy the previous row's status/approved_at/
  farmer_decided_at into the StepResponse compensation payload — the shape
  `steps/decide-topup-request.ts:34-70` uses).
- Workflows src/workflows/accept-claim.ts `acceptClaimWorkflow({ seller_id,
  claim_id })` and src/workflows/dispute-claim.ts `disputeClaimWorkflow(same)`.
  Composition: lock → `validateSellerOpenStep({ seller_id })` → guard → decide →
  release. No `if`/loop in the composition body (a shared helper for the two is
  fine only if it keeps that shape; two short workflows are simpler).
- Routes src/api/vendor/claims/[id]/accept/route.ts and .../dispute/route.ts,
  thin: identity from `req.seller_context!.seller_id`; `import
  "../../../../../types/seller-context"` in BOTH files (depth matches the I/O
  video route); run the workflow; respond with the row from the step result (or
  one `query.graph` read) in the inventory's 200 shape. Never select
  `video_file_key`.
- middlewares.ts: no entry needed (Mercur's `/vendor/*` catch-all authenticates
  the member and resolves `seller_context`; no body). If codegen shows Mercur's
  own `claims.$id` routes taking precedence, say so in the report rather than
  changing Mercur code.
- `bun run codegen` (T-055.2 and T-055.3 depend on the names).

## Cross-cutting checklist
- [ ] `validateSellerOpenStep` first in both workflows (built as written and accepted; D-060 replaces it in T-055.5)
- [ ] PII: response names only — no customer id, phone, address, video key or URL (D-018/D-042/D-045/D-052)
- [ ] D-055: Indonesian messages; apps key on status/code, never message text; a 409 body is rewritten
- [ ] No money, no amount, no ledger row (US-056 settles off-platform, D-058)
- [ ] One mutation per step, compensation on each; server clock saved in the step
- [ ] Route file imports `.../types/seller-context`; `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Start from
- packages/api/src/workflows/decide-topup-request.ts + steps/decide-topup-request.ts:34-70
- packages/api/src/workflows/mark-lot-sold-status.ts:23-42 (lock + read-only guard)
- packages/api/src/workflows/open-claim.ts (claim module access + lock key shape)
- packages/api/src/api/vendor/claims/[id]/video/route.ts (seller context import)

## Do not touch
- apps/**; src/api/admin/**; src/api/store/**; the open-claim workflow; lot columns

## Spec (packages/api/integration-tests/http/won-lot-claim-farmer-decisions.spec.ts)
Seed `delivered` lot + claim through the module service, exactly as
claims-read.spec.ts:134-199 does (never a route).
- accept on `open` → 200 `approved`, `approved_at` ≈ now, `farmer_decided_at` set,
  `decided_by`/`decision_reason` null; module read agrees
- dispute on `open` → 200 `disputed`, `approved_at` null
- accept twice → second 409 and no second change; dispute after accept → 409;
  accept after dispute → 409
- another farm's claim → 404, row unchanged (no existence leak)
- terminated farm → 403; a `pending` farm → 403 (validateSellerOpenStep);
  suspended farm → 403 (D-054 literal, mvp-Q45; built as written — D-060/T-055.5 changes this case to 200)
- unknown claim id → 404; no member token / no `x-seller-id` → 401
- forced failure after the update → previous status restored (compensation)
- serialised JSON of both 200s has no video key, no URL, no phone, no customer id
  (assert on JSON, like integration-tests/http/pii-leaks.spec.ts)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated claim route names
cd packages/api && bun run test:integration:http -- won-lot-claim-farmer-decisions → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (method, path, body, 200 shape, every error
status + code) + migration name.
```

```text
Story: US-055 (task T-055.1b)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: T-055.1a (columns exist, codegen has run).

## Acceptance criteria
- AC2: Only a disputed claim goes to admin, whose decision (`approved` or `rejected`) is final and saved with a reason.

## Decisions in force
D-038 (`disputed → approved | rejected`, admin only). D-002 (route under
`/admin/*`, admin-authenticated by Medusa's default). D-042/D-045 (admin sees
names only — the row already carries no phone; keep it that way). D-018/D-040
(no key/URL in any response). D-055 (Indonesian messages; the reason is
required and non-blank, like `api/admin/topup-requests/validators.ts:26-28`).
CLAUDE.md §8: workflow with compensation; save the decision when it happens.

## Build
- validators.ts in src/api/admin/claims/: `AdminDecideClaimBody` =
  `z.object({ reason: z.string().trim().min(1, "Alasan wajib diisi.") })`.
- src/workflows/steps/claim.ts: one read-only guard
  `getAdminDecidableClaimStep({ claim_id })` under the `claim:<id>` lock:
  missing → NOT_FOUND "Klaim tidak ditemukan."; `status !== "disputed"` →
  CONFLICT "Klaim ini tidak sedang disengketakan." code `claim_not_disputed`.
  One mutation `decideClaimAsAdminStep({ claim_id, status, decided_by, reason })`:
  set status, `approved_at` only on approve (server clock), `decided_by`,
  `decided_at`, `decision_reason`; compensation restores the previous
  status/approved_at/decided_by/decided_at/decision_reason.
- Workflows src/workflows/approve-claim.ts and src/workflows/reject-claim.ts,
  `{ claim_id, admin_id, reason }`: lock → guard → decide → release.
- Routes src/api/admin/claims/[id]/approve/route.ts and .../reject/route.ts:
  thin; `admin_id` from `req.auth_context.actor_id`; `reason` from
  `req.validatedBody`; respond with the inventory's 200 shape.
- middlewares.ts: `POST /admin/claims/:id/approve` and `/reject` →
  `validateAndTransformBody(AdminDecideClaimBody)`.
- src/api/admin/claims/route.ts: add `decision_reason` and `decided_at` to the
  mapped rows (`decided_at` ISO, else null). Keep it admin-only; `toClaimListRows`
  stays as it is so the farmer row does not change.
- `bun run codegen`.

## Start from
- packages/api/src/api/admin/topup-requests/[id]/reject/route.ts (thin decision route)
- packages/api/src/api/admin/topup-requests/validators.ts:24-30 (reason validator)
- packages/api/src/workflows/steps/decide-topup-request.ts:18-70 (guard + compensation)
- packages/api/src/api/admin/claims/route.ts (row mapping to extend)

## Cross-cutting checklist
- [ ] PII: names only; no customer id, phone, address, video key or URL (D-018/D-042/D-045/D-052)
- [ ] D-055: Indonesian messages (the reason's 400 included); apps key on status/code; 409 body rewritten
- [ ] No money, no amount, no ledger row (US-056 settles off-platform, D-058)
- [ ] Workflow with compensation; `decided_*` from `req.auth_context.actor_id` + the server clock
- [ ] Route changes → `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Do not touch
- apps/**; src/api/vendor/**; src/api/store/**; the claim model (T-055.1a added
  every column; no second migration)

## Spec (packages/api/integration-tests/http/won-lot-claim-admin-decisions.spec.ts)
Seed a `disputed` claim through the module service (claims-read.spec.ts:134-199).
- approve with a reason → 200 `approved`, `decision_reason` saved, `decided_by` =
  admin user id, `decided_at` ≈ now, `approved_at` set; module read agrees
- reject with a reason → 200 `rejected`, reason saved, `approved_at` null
- approve an `open` claim → 409 `claim_not_disputed`; approve an `approved`
  claim → 409; reject after approve → 409 (final)
- blank / missing reason → 400; unknown id → 404
- customer token or no token on either route → 401/403
- GET /admin/claims?status=disputed contains it before the decision, absent
  after; ?status=approved after approval contains it with `decision_reason`;
  default (`open`) excludes it
- forced failure after the update → previous fields restored (compensation)
- serialised JSON has no video key, URL, phone or customer id

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated admin claim route names
cd packages/api && bun run test:integration:http -- won-lot-claim-admin-decisions → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (method, path, body, 200 shape, every error
status + code) + the two new row fields.
```

```text
Story: US-055 (task T-055.2)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=40 min
Starts after: T-055.1a and its codegen. May run parallel with T-055.3.

## Acceptance criteria
- AC1: The farmer can accept, which moves the claim straight to `approved` with no admin step, or dispute (`open → disputed`) (D-038).

## Decisions in force
D-054 + checklist (the backend guard is the source of truth; the button hides
for a non-`open` claim). D-055 (409 body is rewritten → the app writes its own
copy; apps key on status). D-002/D-004 (storefront only; no admin surface here).

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /vendor/claims | yes | unchanged rows (id, lot_id, status, remedy, opened_at, has_video, winner{name}, product{title,thumbnail}) |
| GET | /vendor/claims/:id/video | yes | raw bytes → existing ClaimVideo |
| POST | /vendor/claims/:id/accept | yes (T-055.1a) | → 200 { claim: { id, lot_id, status, approved_at, farmer_decided_at, decision_reason } } |
| POST | /vendor/claims/:id/dispute | yes (T-055.1a) | → 200 same, status "disputed", approved_at null |

## Build (one surface: the claim block on a sold-lot row)
- src/lib/data/claims.ts: add `acceptClaim(id)` and `disputeClaim(id)` using the
  codegen names (expected `sdk.vendor.claims.$id.accept.mutate` /
  `sdk.vendor.claims.$id.dispute.mutate`; check `.mercur/routes.d.ts` and use the
  exact name — fix the call, never the route) with `vendorHeaders()`. Return
  `{ success: true } | { message, code, status }`, like `markSoldLotShipped`.
- src/lib/helpers/farm-claim.ts (+ .test.ts): `claimDecisionFailure({ status,
  code, message })` → 409 "Klaim ini sudah diputuskan. Halaman diperbarui."
  refresh true; 404 "Klaim tidak ditemukan." refresh true; 403 the server's
  message; otherwise the server's message. Mirror `shipFailureInfo`.
- SoldLotsPage.tsx ClaimBlock: when `claim.status === 'open'`, draw two buttons
  — "Setujui klaim" and "Ajukan sengketa". Each asks `confirm` first (copy names
  the remedy, e.g. "Setujui klaim dengan pengembalian dana? Pemenang akan
  dihubungi untuk penyelesaian."), disables both while busy, and on success
  shows a toast ("Klaim disetujui." / "Sengketa diajukan.") then
  `router.refresh()`. On failure show the helper's message and refresh when it
  says so. For every other status the block stays as today, with no buttons.
  Small client component beside `ClaimVideo` (e.g. components/ClaimDecision.tsx)
  if the page's row must stay a server component — the page is already a server
  component, so copy the `ShipLot` shape.
- No new route, no nav change, no money text or amount anywhere.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/ShipLot.tsx
- apps/storefront-koi/src/lib/data/claims.ts (vendorHeaders + result shape)
- apps/storefront-koi/src/components/sections/AccountPage/SoldLotsPage.tsx:191-210
- apps/storefront-koi/src/lib/helpers/sold-lot-actions.ts:49-74

## Cross-cutting checklist
- [ ] PII: names only; the winner's phone/address is never shown (D-042/D-052)
- [ ] D-055: 409/403 copy is the app's own; key on status, never message text
- [ ] No money, amount or "refund" text implying a payment already happened (US-056 settles off-platform, D-058)
- [ ] UI task: render check on the changed route, submit one decision (render-check skill)
- [ ] `bun run check` clean; no new route, no raw `fetch`

## Do not touch
- packages/api; apps/admin-koi; the winner's screens; the claim form

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/kebun/terjual as sakura.koi.farm@koi.dev, one seeded `open`
claim on its sold lot): buttons only on the open claim, accept submit →
refresh shows Disetujui, a seeded `disputed` claim shows no buttons → clean;
screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-055 (task T-055.3)   Release: mvp
Agent: frontend (admin-koi)   Expected: <=45 min
Starts after: T-055.1b and its codegen. May run parallel with T-055.2.

## Acceptance criteria
- AC2: Only a disputed claim goes to admin, whose decision (`approved` or `rejected`) is final and saved with a reason.

## Decisions in force
D-002 (this app only), D-038 (only `disputed` gets a decision; the decision is
final), D-042/D-045 (rows carry names only), D-018 (video bytes via the admin
route), D-055 (Indonesian copy; a 409 body is rewritten, so key on status).
admin-koi CLAUDE.md: a decision that punishes or moves money needs a written
reason — here the reason is required by AC2 either way.

## Endpoint inventory
| Method | Path | Exists? | Shape |
|---|---|---|---|
| GET | /admin/claims?status=disputed | yes (T-054.1b) | { claims: [{ id, lot_id, status, remedy, opened_at, has_video, winner{name}, seller{name}, product{title,thumbnail}, decision_reason, decided_at }], count, limit, offset } |
| GET | /admin/claims?status=approved | yes (T-054.1b) | same row shape |
| GET | /admin/claims?status=rejected | yes (T-054.1b) | same row shape |
| GET | /admin/claims/:id/video | yes (T-054.1b) | raw bytes → existing VideoView |
| POST | /admin/claims/:id/approve | yes (T-055.1b) | body { reason } → 200 { claim: { …, status: "approved", decision_reason, decided_by, decided_at } } |
| POST | /admin/claims/:id/reject | yes (T-055.1b) | body { reason } → 200 same, status "rejected" |

## Build (one surface: the `/klaim` dispute queue)
- src/lib/data/claims.ts: `approveClaim(id, reason)` and `rejectClaim(id,
  reason)` server actions — `requireAdmin(ROUTES.claims)` first, codegen names
  (expected `sdk.admin.claims.$id.approve.mutate` / `.reject.mutate`), then
  `revalidatePath(ROUTES.claims)`; return `{ success } | { error }` like
  `rejectTopup` (apps/admin-koi/src/lib/data/topups.ts:113-130). Extend the
  `AdminClaim` type with `decision_reason: string | null; decided_at: string | null`.
- src/lib/helpers/claim-format.ts (+ .test.ts): `claimDecisionFailure(status)` →
  409 "Klaim ini sudah diputuskan. Halaman diperbarui." (refresh), 404 "Klaim
  tidak ditemukan." (refresh), else the server message; `decidedLabel`
  if useful.
- ClaimQueue.tsx: keep the read-only card, add a decision form under the video
  for rows whose `status === 'disputed'` — one `FormField` + `Input` for the
  written reason and two buttons "Setujui" and "Tolak" (confirm before submit),
  both disabled while busy, toast + `router.refresh()` on success, helper message
  on failure. Rows in `approved`/`rejected` render read-only with
  `decision_reason` and `decided_at` (Jakarta time).
- src/app/(app)/klaim/page.tsx: read three lists (`disputed` as the working tab,
  `approved` and `rejected` for the decided tab) through `listClaims`, and give
  `ClaimQueue` a `Tabs` split like TopupQueue.tsx:61-86. Empty copy:
  "Tidak ada sengketa menunggu." / "Belum ada klaim yang diputuskan."
  Keep `requireAdmin(ROUTES.claims)`.
- No money text, no amount, no new nav entry.

## Start from
- apps/admin-koi/src/components/ClaimQueue.tsx:57-85 (row to extend)
- apps/admin-koi/src/components/TopupQueue.tsx:51-86, 101-137, 246-364 (tabs + decision forms)
- apps/admin-koi/src/lib/data/topups.ts:113-130 (guarded decision action)
- apps/admin-koi/src/lib/helpers/claim-format.ts

## Do not touch
- packages/api; apps/storefront-koi; US-054's read-only row facts and video loader

## Cross-cutting checklist
- [ ] D-002: this app only; every server action calls `requireAdmin(ROUTES.claims)` itself
- [ ] PII: rows carry names only — no phone, address, customer id; the video only via the admin route (D-018/D-042/D-045)
- [ ] D-055: Indonesian copy; a 409 body is rewritten, so key on status and refresh
- [ ] A written reason is required before either decision submits; confirm before submit
- [ ] No money, amount or refund-completion text (US-056 settles off-platform, D-058)
- [ ] UI task: render check on `/klaim` including one approve and one reject (render-check skill)
- [ ] `bun run check` clean; no raw `fetch`; no new nav entry

## Definition of done
cd apps/admin-koi && bun run check → pass
render check (http://127.0.0.1:3002/klaim as admin@koi.dev) with one seeded
`disputed` claim: the disputed tab shows it, approve with a reason → toast, the
row leaves the tab and appears in the decided tab with the reason; reject on a
second seeded claim likewise → clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-055 (task T-055.4)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC2. Decisions: D-038, D-027 (closed states are US-056's), D-002,
D-042/D-045/D-052, D-018/D-040, D-054, D-055.
Code under test: packages/api/src/workflows/{accept-claim,dispute-claim,
approve-claim,reject-claim}.ts, src/workflows/steps/claim.ts,
src/api/vendor/claims/[id]/{accept,dispute}/route.ts,
src/api/admin/claims/[id]/{approve,reject}/route.ts, src/api/admin/claims/route.ts,
src/modules/moderation/**, and the two screens.
Commands (alone): bun run test:integration:http -- won-lot-claim-farmer-decisions;
then -- won-lot-claim-admin-decisions; then -- claims-read. Then bun run check in
both Koi apps.
Seeding: a `delivered` lot + claim through the module service (as
claims-read.spec.ts:134-199); for the browser set status (open/disputed) and
approved_at/decision_reason on a seeded claim with psql. Never add a mark-paid,
mark-delivered or decide-by-SQL test route — psql is only for browser seeding.
Browser (render-check): farmer accepts on /akun/kebun/terjual → row reads
"Disetujui" and the claim never appears on /klaim's disputed tab; farmer disputes
on a second claim → it appears on /klaim; admin approves it with a reason → it
moves to the decided tab with the reason; admin rejects a third with a reason.
Watch for: a repeat or illegal decision returning 200 (accept twice, accept after
dispute, admin approve on `open`, reject after approve, any second decision);
a blank reason accepted; `approved_at` set on a rejection or missing on a farmer
accept; any ledger row, amount field or money text (US-056 settles off-platform, D-058); a video
key/URL, phone or customer id in any response or row; a suspended farm allowed to
decide (403 for pending/rejected/terminated; a farm suspended after approval may decide after D-060/T-055.5); a decision that
reaches `resolved`/`confirmed` (nothing in this story may); another farm's claim
visible or decidable (404).
Do not change app code. Report PASS/FAIL per AC with file:line and command
output; bugs with repro and expected/actual.
```

### US-056 Approved claims are resolved · `todo` (unparked 2026-11-17 by D-058; briefs written 2026-11-17)
**D-058 restores the direct path.** The MVP pays off-platform, so the 2026-11-16
escrow note is void: the farmer refunds the winner directly or ships a
replacement, exactly as AC1 says. No escrow, no platform refund, no ledger row;
the platform records only the claim's state.
As a **winner**, I want an approved claim settled within 3 days so that I'm made
whole. *(Plan: Dead-on-arrival claims 4–6; D-027, D-038, D-058)*
- AC1: The farmer has 3 days to refund directly or ship a replacement, then marks it done (`approved → resolved`). The winner confirms (`resolved → confirmed`). The 3 days start when the claim becomes `approved`, on both paths (D-038).
- AC2: Missing the 3 days, or refusing an approved claim, makes the farmer eligible for a strike (US-059).
- AC3: The farmer stays responsible even if a courier caused the death.
- AC4: If the winner doesn't confirm within 3 days of `resolved`, the existing scheduled job sets the claim to `confirmed` (D-027).
- [ ] T-056.1a [backend] `claim.resolved_at` + `confirmed_at`; `resolve` (`approved → resolved`) and `confirm` (`resolved → confirmed`) workflows and routes; `resolved_at`/`confirmed_at` on the farmer, winner-adjacent and admin claim rows, `approved_at` on the admin row
- [ ] T-056.1b [backend] The 3-day auto-confirm job (`resolved → confirmed` after `resolved_at` + 3 days), idempotent, batched (new `src/jobs/confirm-claims.ts`, not `close-lots.ts`)
- [ ] T-056.2a [storefront] Farmer marks an `approved` claim done on `/akun/kebun/terjual`
- [ ] T-056.2b [storefront] Winner confirms a `resolved` claim on `/akun/menang`
- [ ] T-056.3 [admin] Overdue `approved` claims flagged on `/klaim`'s approved tab (the flag only; the strike itself is US-059 T-059.2)
- [ ] T-056.4 [qa] `approved → resolved → confirmed` in order; a `resolved` claim older than 3 days becomes `confirmed` once; running the job twice changes nothing; no money moves

**Readiness 2026-11-17: ready (`todo`). Nothing blocks it.**
- AC1/AC4 are decided: D-038 gives the enum and the clock start (`approved_at` on both paths),
  D-027 the 3-day auto-confirm and the closed definition. No new claim state, no lot status
  change, no ledger, wallet or payout code is touched.
- **The job D-027 calls "existing" does not exist.** `src/jobs/` holds only `close-lots.ts`
  and `start-auctions.ts`; neither looks at a claim. T-056.1b adds a new hourly job instead
  of folding into `close-lots.ts`: that job runs every minute against `lot.end_time`
  pressure, its `collectIds` is typed `lot | auction`, and its log line and its 12/12 spec
  are about closing lots. A 3-day deadline does not need a per-minute tick.
- **Suspended farm (D-054 literal, built that way):** resolving is neither paid nor shipped
  and D-054 says a suspended farm "can't … do any other farmer action", so `resolve` starts
  with `validateSellerOpenStep` and a suspended farm gets 403. This is the same shape
  US-055 shipped before D-060 relaxed it; flagged in the report as a likely follow-up, not
  a blocker (a decision is in force). The same reading makes a suspended farm unable to
  report a non-payer in US-058 T-058.1.
- **One question, non-blocking (`mvp-Q47`, raised in this run's report; the question table
  is edited elsewhere and is not touched here):** AC2's "or refusing an approved claim" has no
  state behind it — D-038's enum has no `refused` and adding one changes a decision. Built
  as option (a): a refusal that is not acted on is the 3-day miss, so T-056.3 flags an
  `approved` claim older than 3 days and nothing records a separate refusal. No column, so
  the answer can change the copy without a migration.
- AC3 needs no code: it is a policy statement (responsibility to the winner does not move
  to the courier).

**Every legal transition and every refusal (T-056.1a):**

| From → to | Who | Route | Refused with |
|---|---|---|---|
| `approved → resolved` | farmer, own claim, farm `open` | `POST /vendor/claims/:id/resolve` | 404 unknown/another farm's; 403 any farm not `open` (pending, rejected, suspended, terminated); 409 `claim_not_approved` for any other status |
| `resolved → confirmed` | the lot's winner | `POST /store/won-lots/:id/claims/confirm` | 404 unknown or another customer's (no leak); 409 `claim_not_resolved` for any other status, incl. a second confirm |
| `resolved → confirmed` | the job, `resolved_at` + 3 days passed | — | only rows still `resolved`; the workflow re-checks under the lock |

Resolving after the 3-day deadline stays **allowed** (AC2 makes the farmer strike-eligible,
it does not block the fix). No lot status changes in this story: a lot stays at whatever
`delivered`/`claimed` state it held.

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /vendor/claims/:id/resolve | **no** (T-056.1a) | no body → 200 `{ claim: ClaimDecisionRow & { resolved_at, confirmed_at } }`; 403/404/409 |
| POST | /store/won-lots/:id/claims/confirm | **no** (T-056.1a) | no body → 200 `{ claim: { id, lot_id, status: "confirmed", confirmed_at } }`; 404/409 |
| GET | /vendor/claims | yes | rows gain `resolved_at`, `confirmed_at` (ISO or null) |
| GET | /admin/claims?status=approved | yes | rows gain `approved_at`, `resolved_at`, `confirmed_at` (ISO or null) |

#### Briefs

```text
Story: US-056 (task T-056.1a)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-055 T-055.1a/1b (claim decision columns and routes), D-058 in force.

## Acceptance criteria
- AC1: The farmer has 3 days to refund directly or ship a replacement, then marks it done (`approved → resolved`). The winner confirms (`resolved → confirmed`). The 3 days start when the claim becomes `approved`, on both paths (D-038).
- AC2 (data half): the farmer's deadline is readable as `approved_at + 3 days`.

## Decisions in force
D-038: the enum is `open → approved | disputed`, `disputed → approved | rejected`,
`approved → resolved → confirmed`; `approved_at` starts the clock. D-027: the auto-confirm
(reaches `confirmed`) is T-056.1b's job, not this task. D-058: off-platform — this task
changes claim columns only, no wallet read, no ledger row, no payout. D-054 literal: the
resolve route keeps `validateSellerOpenStep` (a suspended farm gets 403), like US-055
shipped before D-060. D-055: Indonesian messages; apps key on status, never message
text (a 409 body is rewritten). CLAUDE.md §8: one workflow per transition, server clock
saved in the step, compensation restores exactly the changed columns.

## Build
- Claim model (src/modules/moderation/models/claim.ts): `resolved_at: model.dateTime().nullable()`,
  `confirmed_at: model.dateTime().nullable()`. Generate the migration
  (`bunx medusa db:generate moderation`).
- steps/claim.ts: `export const CLAIM_CONFIRM_WINDOW_MS = 3 * 24 * 60 * 60 * 1000` (one
  constant; T-056.1b and admin-koi's flag mirror it).
  - `getResolvableClaimStep({ seller_id, claim_id })`, read only, under the `claim:<id>`
    lock: missing or `claim.seller_id !== seller_id` → NOT_FOUND "Klaim tidak ditemukan.";
    `status !== "approved"` → CONFLICT "Klaim ini belum disetujui." code `claim_not_approved`.
  - `resolveClaimStep({ claim_id })`: set `status: "resolved"`, `resolved_at: new Date()`
    (server clock). Compensation restores the previous `status` and `resolved_at`.
  - `getConfirmableClaimStep({ claim_id, winner_customer_id? })`: missing, or
    `winner_customer_id` given and `!== claim.customer_id` → NOT_FOUND "Klaim tidak
    ditemukan." (no existence leak); `status !== "resolved"` → CONFLICT "Klaim ini belum
    ditandai selesai." code `claim_not_resolved`.
  - `confirmClaimStep({ claim_id })`: `status: "confirmed"`, `confirmed_at: new Date()`.
    Compensation restores `status` and `confirmed_at`. Same step serves T-056.1b's job,
    which passes no `winner_customer_id`.
- Workflows: src/workflows/resolve-claim.ts `{ seller_id, claim_id }` — lock →
  `validateSellerOpenStep` → guard → mutate → release (D-054 literal; same order as
  accept-claim.ts).
  src/workflows/confirm-claim.ts `{ claim_id, winner_customer_id? }` — lock → guard →
  mutate → release.
- Routes: src/api/vendor/claims/[id]/resolve/route.ts — body-less, strict empty body
  (paid/route.ts:24-31 shape), identity from `req.seller_context`, import
  "../../../../../types/seller-context", respond `toClaimDecisionRow(result)`.
  src/api/store/won-lots/[id]/claims/confirm/route.ts — body-less, identity from
  `req.auth_context.actor_id`, respond `{ claim: { id, lot_id, status, confirmed_at } }`.
- Row fields: `resolved_at`, `confirmed_at` on `ClaimDecisionRow` + `toClaimDecisionRow`
  and on `ClaimListRow` + `toClaimListRows` (vendor and admin share it); `approved_at` on
  `AdminClaimListRow` only (the admin mapper adds it from the same claim row). ISO or null.
- middlewares.ts: `POST /store/won-lots/:id/claims/confirm` →
  `authenticate("customer", ["bearer", "session"])`. No vendor entry (body-less, Mercur's
  `/vendor/*` catch-all authenticates and resolves `seller_context`).
- `bun run codegen`.

## Start from
- packages/api/src/workflows/accept-claim.ts (lock → guard → mutate → release)
- packages/api/src/workflows/steps/claim.ts (guard + compensation pair to copy)
- packages/api/src/api/store/won-lots/[id]/delivered/route.ts (store route, strict empty body)
- packages/api/src/api/vendor/claims/[id]/accept/route.ts (vendor response mapper)

## Do not touch
- apps/**; the open/dispute/approve/reject workflows' behaviour (only the shared row
  mappers); the lot model or `LOT_STATUSES`; money, wallet or ledger code; claim videos

## Spec (packages/api/integration-tests/http/claim-resolution.spec.ts)
Seed a `delivered` lot + claim through the module service (claims-read.spec.ts:134-199).
- resolve an `approved` claim → 200 `resolved`, `resolved_at` ≈ now, `confirmed_at` null;
  module read agrees
- resolve twice → 409; resolve on `open` / `disputed` / `rejected` / `confirmed` → 409,
  row unchanged; resolve a claim whose `approved_at` is 4 days old → 200 (the deadline does
  not block the fix)
- winner confirm → 200 `confirmed`, `confirmed_at` ≈ now; confirm again → 409; confirm on
  `approved` / `open` / `disputed` / `rejected` → 409, row unchanged
- confirm by another customer → 404 and unchanged; another farm resolves → 404;
  pending / rejected / terminated farm → 403 (validateSellerOpenStep); suspended farm → 403
  (D-054 literal, unchanged by D-060 which covers accept/dispute only)
- no member token / no `x-seller-id` → 401; no customer token on confirm → 401
- the lot row is untouched after both transitions (`status`, `winner_customer_id`,
  `final_price`); no `wallet_transaction` row written and both wallets' summed balances
  unchanged
- forced failure after the mutation → previous columns restored (compensation)
- serialised JSON of both 200s has no video key, no URL, no phone, no customer id

## Cross-cutting checklist
- [ ] Every mutation is a workflow step with compensation; timestamps from the server clock
- [ ] `validateSellerOpenStep` first in the resolve workflow (D-054 literal, as accept-claim.ts)
- [ ] PII: names only; never a customer id, phone, address, video key or URL (D-042/D-045/D-052)
- [ ] D-055: Indonesian messages; apps key on status/code; a 409 body is rewritten
- [ ] No money, no amount, no ledger row anywhere (D-058)
- [ ] Route file reading `req.seller_context` imports `.../types/seller-context`
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated claim resolve/confirm route names
cd packages/api && bun run test:integration:http -- claim-resolution → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (both routes, body, 200 shape, every error status +
code) + migration name + the two new row fields.
```

```text
Story: US-056 (task T-056.1b)   Release: mvp
Agent: backend   Expected: <=30 min
Starts after: T-056.1a (columns, `confirmClaimWorkflow`, `CLAIM_CONFIRM_WINDOW_MS`).

## Acceptance criteria
- AC4: If the winner doesn't confirm within 3 days of `resolved`, the existing scheduled job sets the claim to `confirmed` (D-027).

## Decisions in force
D-027 (3-day auto-confirm; this job is the "existing scheduled job" D-027 means — it does
not exist yet, so it is created here). D-058 (no money). CLAUDE.md §9 (jobs: fetch by
`{ id }`, run a workflow, be idempotent, batch large sets); §8 (no recomputation, server
clock in the step).

## Build
- src/jobs/confirm-claims.ts (copy close-lots.ts:15-39 pagination): `PAGE = 50`, collect
  ids first, filter `{ status: "resolved", resolved_at: { $lte: new Date(Date.now() -
  CLAIM_CONFIRM_WINDOW_MS) } }`, order `{ id: "ASC" }`, then run
  `confirmClaimWorkflow(container).run({ input: { claim_id: id } })` per id (no
  `winner_customer_id`). Per-id try/catch: one failure logged, the rest run. One summary
  log: `confirm-claims: found N, confirmed X, failed Y`.
- `export const config = { name: "confirm-claims", schedule: "0 * * * *" }`. Comment why
  hourly and why not `close-lots.ts` (3-day deadline; a different domain and log line).
- No route, so no codegen.

## Start from
- packages/api/src/jobs/close-lots.ts (collect-then-process, per-id try/catch, summary log)
- packages/api/src/workflows/confirm-claim.ts (T-056.1a)

## Do not touch
- apps/**; close-lots.ts / start-auctions.ts; the claim model (T-056.1a added the columns)

## Spec (packages/api/integration-tests/http/confirm-claims-job.spec.ts)
Seed `resolved` claims through the module service with explicit `resolved_at`.
- one `resolved_at` = now − 3 days − 1 h and one = now − 3 days + 1 h → run the job →
  the old one is `confirmed` with `confirmed_at` set, the young one untouched
- run the same job again → second run finds 0 and changes nothing (idempotent)
- a `resolved` claim with `resolved_at` in the future → untouched
- a forced failure inside the workflow for one row (farmer-auctions.spec.ts:18-34 pattern)
  → logged, the other rows still confirm
- no `wallet_transaction` row and no amount field appears anywhere

## Cross-cutting checklist
- [ ] Job fetches ids then processes each by `{ id }`; no unbounded read
- [ ] Idempotent: the filter plus the workflow's `status === "resolved"` re-check under the
      `claim:<id>` lock; a re-run or overlapping tick changes nothing
- [ ] Batched (PAGE 50); one failure does not stop the batch
- [ ] No money, no ledger row (D-058); no lot status change
- [ ] No route change → no codegen; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run test:integration:http -- confirm-claims-job → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the job's file, schedule and log line.
```

```text
Story: US-056 (task T-056.2a)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=35 min
Starts after: T-056.1a and its codegen. May run parallel with T-056.2b.

## Acceptance criteria
- AC1 (farmer half): the farmer marks an approved claim done, `approved → resolved`.

## Decisions in force
D-038 (only `approved` offers this action), D-058 (off-platform: no amount, no "refund
processed" copy — the farmer says the direct refund or replacement is done), D-055 (409
body rewritten → the app writes its own copy; key on status), D-052 (no phone/address on
this surface).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /vendor/claims | yes | rows gain `resolved_at`, `confirmed_at` (T-056.1a) |
| POST | /vendor/claims/:id/resolve | no → T-056.1a, first | no body → 200 `{ claim: { id, lot_id, status: "resolved", approved_at, resolved_at, confirmed_at, decision_reason } }`; 403 `seller_terminated`; 404; 409 |

## Build (one surface: the claim block on a sold-lot row)
- src/lib/data/claims.ts: `resolveClaim(id)` beside `acceptClaim`/`disputeClaim`, same
  result type and `vendorHeaders()`; `revalidatePath(ROUTES.farmSold)` on success.
- src/lib/helpers/farm-claim.ts (+ .test.ts): `claimResolutionFailure({ status, code,
  message })` → 409 "Klaim sudah berubah. Halaman diperbarui." (refresh), 404 "Klaim tidak
  ditemukan." (refresh), 403 the server's Indonesian message, else the server's message.
- SoldLotsPage ClaimBlock (SoldLotsPage.tsx:193-213): when `claim.status === 'approved'`
  draw one button "Tandai klaim selesai" (client component beside `ClaimDecision.tsx`,
  same `confirm` → busy → toast → `router.refresh()` shape). Confirm copy names the remedy,
  e.g. "Sudah mengembalikan dana / mengirim ikan pengganti? Klaim akan ditutup dan pemenang
  mengonfirmasi." Every other status renders exactly as today. No amount, no money wording.
- `VendorClaim` type gains `resolved_at: string | null; confirmed_at: string | null`.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/ClaimDecision.tsx
- apps/storefront-koi/src/lib/data/claims.ts (decideClaim)
- apps/storefront-koi/src/lib/helpers/farm-claim.ts

## Do not touch
- packages/api; apps/admin-koi; WonLotsPage; the claim form or the video block

## Cross-cutting checklist
- [ ] D-055: 409/404 copy is the app's own; never key on message text
- [ ] PII unchanged: names only, no phone/address (D-042/D-052)
- [ ] No money, amount, ledger or "refund completed" text (D-058)
- [ ] UI task: render check on the changed route, one submit (render-check skill)
- [ ] `bun run check` clean; no raw `fetch`, no new route

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/kebun/terjual as sakura.koi.farm@koi.dev, one seeded `approved`
claim): button only on that claim, submit → row reads "Menunggu konfirmasi" → clean;
screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-056 (task T-056.2b)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=30 min
Starts after: T-056.1a and its codegen. May run parallel with T-056.2a.

## Acceptance criteria
- AC1 (winner half): the winner confirms, `resolved → confirmed`.

## Decisions in force
D-038 (only `resolved` offers confirm), D-058 (nothing moves on the platform), D-055 (409
→ the app's own copy; key on status). One surface: the won-lot row; the lot page's claim
line stays read-only (do not add a second confirm button).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/won-lots | yes | rows carry `claim: { id, status, remedy, opened_at }` (unchanged) |
| POST | /store/won-lots/:id/claims/confirm | no → T-056.1a, first | no body → 200 `{ claim: { id, lot_id, status: "confirmed", confirmed_at } }`; 404; 409 |

## Build (one surface: the won-lot row on `/akun/menang`)
- src/lib/data/lots.ts: `confirmClaim(lotId)` beside the claim POST (:310), customer
  headers as there; `revalidatePath(ROUTES.wonLots)` on success; return
  `{ success } | { message, code, status }`.
- WonLotsPage.tsx claim block (:155-170): when `lot.claim?.status === 'resolved'` show
  "Konfirmasi klaim selesai" (small client component copied from `MarkPaid.tsx`: confirm →
  busy → toast → `router.refresh()`; 409 → "Klaim sudah dikonfirmasi. Halaman diperbarui."
  + refresh; 404 → "Klaim tidak ditemukan." + refresh; else the server message). Other
  statuses unchanged: the existing status line plus the open-claim link.
- No money, no amount, no phone/address (D-052, D-058).

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/MarkPaid.tsx
- apps/storefront-koi/src/components/sections/AccountPage/WonLotsPage.tsx:150-175
- apps/storefront-koi/src/lib/data/lots.ts:295-330 (the claim server action)

## Do not touch
- packages/api; apps/admin-koi; SoldLotsPage; the lot detail page's won panel; the claim form

## Cross-cutting checklist
- [ ] D-055: 409/404 copy is the app's own
- [ ] PII unchanged: no farmer phone, no address change (D-052)
- [ ] No money text or amount (D-058)
- [ ] UI task: render check on `/akun/menang`, one confirm (render-check skill)
- [ ] `bun run check` clean; no raw `fetch`

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/menang as a seeded winner whose claim is `resolved`): button present,
submit → status reads "Selesai" → clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-056 (task T-056.3)   Release: mvp
Agent: frontend (admin-koi)   Expected: <=35 min
Starts after: T-056.1a (admin row carries `approved_at`).

## Acceptance criteria
- AC2 (visibility half): a farmer who misses the 3 days is visible to the admin as overdue.
  The strike itself is US-059 T-059.2 — do not add a strike action here.

## Decisions in force
D-038/D-027 (3 days from `approved_at`), D-002 (this app only), D-055 (Indonesian copy),
admin-koi rule (a punishing action needs a written reason — that action is US-059's, so
this screen is read-only). `mvp-Q47` (US-056): D-038 has no "refused" state, so only the missed
deadline is flagged.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /admin/claims?status=approved | yes | rows gain `approved_at`, `resolved_at`, `confirmed_at` (T-056.1a) |

## Build (one surface: the approved tab of `/klaim`)
- src/lib/helpers/claim-format.ts (+ .test.ts): `claimOverdue(approvedAt, now)` →
  `{ overdue: boolean; label: string }`, 72 h window (mirror `CLAIM_CONFIRM_WINDOW_MS`),
  label "Lewat tenggat 3 hari" or "Sisa 2 hari 4 jam"; unknown/null date → not overdue,
  empty label.
- src/lib/data/claims.ts: extend `AdminClaim` with `approved_at: string | null`
  (`resolved_at`/`confirmed_at` optional if the decided list shows them).
- ClaimQueue.tsx approved tab row: draw `approved_at` in Jakarta time and, when
  `claimOverdue(...)`, an `attention` Badge with the label. No new route, no new nav item,
  no strike button, no money text.

## Start from
- apps/admin-koi/src/lib/helpers/claim-format.ts
- apps/admin-koi/src/components/ClaimQueue.tsx (decided row)
- apps/admin-koi/src/components/TopupQueue.tsx:246-364 (badge/timestamp row shape)

## Do not touch
- packages/api; apps/storefront-koi; the disputed tab and its decision forms

## Cross-cutting checklist
- [ ] D-002: this app only; the page keeps `requireAdmin(ROUTES.claims)`
- [ ] PII: names only — no phone, address, customer id (D-042/D-045)
- [ ] D-055: Indonesian copy
- [ ] No strike action, no money text (US-059 owns the strike; D-058 no money)
- [ ] UI task: render check on `/klaim` with one 4-day-old and one fresh approved claim
- [ ] `bun run check` clean

## Definition of done
cd apps/admin-koi && bun run check → pass
render check (http://127.0.0.1:3002/klaim as admin@koi.dev, two seeded `approved` claims,
`approved_at` 4 days apart set with psql): the older row shows the overdue badge, the
fresh one does not → clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-056 (task T-056.4)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC4. AC3 is policy (no code) — say so rather than inventing a test.
Decisions: D-027, D-038, D-054, D-058, D-060, D-055, D-042/D-045/D-052.
Code under test: packages/api/src/workflows/{resolve-claim,confirm-claim}.ts,
src/workflows/steps/claim.ts, src/jobs/confirm-claims.ts,
src/api/vendor/claims/[id]/resolve/route.ts,
src/api/store/won-lots/[id]/claims/confirm/route.ts, the three row mappers, and the two
screens + `/klaim`.
Commands (alone): bun run test:integration:http -- claim-resolution; then --
confirm-claims-job. Then bun run check in both Koi apps.
Seeding: lot + claim through the module service (claims-read.spec.ts:134-199); for the
browser set `approved_at`/`resolved_at` with psql (never a test route).
Browser (render-check): farmer resolves on /akun/kebun/terjual → row reads
"Menunggu konfirmasi"; winner confirms on /akun/menang → "Selesai"; admin sees the overdue
badge on the 4-day-old approved claim and not on the fresh one.
Watch for: a skipped transition (`approved → confirmed` in one call) or a repeat returning
200; `resolved_at` set on a non-resolution; `confirmed_at` from the job on a row that was
not `resolved`; a second job run changing anything; any `wallet_transaction` row, amount
field or money text (D-058); a lot `status`/`winner_customer_id`/`final_price` change;
another farm resolving or another customer confirming and getting anything but 404;
a suspended farm resolving (403, D-054 literal; if D-060 is extended to resolve, this
becomes 200 — say which the code does rather than failing it).
Do not change app code. Report PASS/FAIL per AC with file:line and command output; bugs
with repro and expected/actual.
```

**Coverage:** AC1 → T-056.1a/.2a/.2b; AC2 → T-056.1a (data) + T-056.3 (flag), the strike
itself US-059 T-059.2; AC3 → no code (policy); AC4 → T-056.1b/.1a. Plan "Dead-on-arrival
claims 4–6" and "Claim statuses (D-027, D-038)" stay covered by US-054, US-055, US-056,
US-061.

### US-057 Winner rates the farmer · `todo`
**Status confirmed 2026-11-17:** unchanged by D-058/D-059/D-060/D-061; `todo` for
Epic 5, after the paid loop.
**Depends on:** US-092 (masking on the public farm page) — satisfied for this
story by returning a display name only (see below); US-092's own encryption
tasks stay open and do not wait on this story.
As a **winner**, I want to rate the farmer after shipping so that other buyers
can judge farms. *(Plan: Ratings)*
- AC1: Available once the lot is `shipped`: 1–5 stars and a comment, once per lot.
- AC2: Ratings show on the farm's page (`mitra/[handle]`).
**PII (D-039):** anything this story shows about the rater beyond a display name (phone, NIK) is masked, because `mitra/[handle]` is a public page. US-092 delivers it.

**Readiness 2026-11-18: ready (`todo`). Nothing blocks it. One new
question, non-blocking (`mvp-Q48`), with the build default pinned below.**
- **The US-092 dependency is satisfied by narrowing the row.** The story needed
  US-092 only to mask whatever the rating shows about the rater. This story
  returns a display name only — the rater's `first_name`, derived at read time —
  and never a customer id, phone, NIK or email. US-092 T-092.2's response
  middleware already masks every `seller`/`sellers` value on `/store/*`
  (`api/utils/mask-response.ts:106-155`), and `mitra/[handle]`'s seller read is
  `GET /store/sellers`. Nothing here waits on US-092's encryption.
- No money: a rating writes no ledger row and moves nothing (D-058's scope is
  the sale; a rating is not a fee).

**What the rating is, pinned:**

| Question | Answer | Source |
|---|---|---|
| Who may rate | the lot's `winner_customer_id` only; any other caller gets 404 (no existence leak) | AC1; US-051's own-lots scoping |
| Which lot statuses | `shipped`, `delivered`, `claimed` — "once shipped or later". `open`/`unsold`/`won`/`paid`/`cancelled` → 409 `lot_not_shipped` | AC1 ("once the lot is `shipped`"); interpretation pinned as `mvp-Q48` default |
| One per lot | unique index on `farmer_rating.lot_id`; a second POST → 409 `rating_exists`, no second row | AC1 ("once per lot") |
| Score | 1–5 whole stars, required. Comment optional, ≤300 characters (the existing review sheet's limit) | AC1; `components/sections/AccountPage/components/ReviewForm.tsx` |
| Farmer reply | none in the MVP — no reply column, no route, no button | plan "Ratings" says only "1–5 stars and a comment" |
| Farmer sees | the same public list on their own farm page. No separate Farmer-area ratings screen in this story | plan "Ratings"; story has two tasks only |
| What the farm page shows | average to one decimal + count + the latest 6 (stars, comment, rater first name, date). No ratings → the whole block is hidden, never "0,0" | AC2; `lib/adapters/seller.ts:11-15` (no invented zeroes) |
| Rater name | first name only, from `customer.first_name`, at read time. No mask characters, no id | story's PII line ("beyond a display name") |
| Banned winner | may still rate — AC2 of US-059 blocks only join, bid and auction creation | US-059 AC2 |

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /store/won-lots/:id/rating | **no** (T-057.1) | body `{ stars: 1..5, comment?: string ≤300 }` → 201 `{ rating: { id, lot_id, stars, comment, created_at } }`; 400 bad body; 401 no token; 404 unknown lot or not the caller's win (`"Lot tidak ditemukan."`); 409 `lot_not_shipped` / `rating_exists` |
| GET | /store/won-lots and /store/won-lots/:id | yes | rows gain `rating: { id, stars, comment, created_at } \| null` (T-057.1) |
| GET | /store/ratings?seller_id=:id | **no** (T-057.1b) | `{ average: number \| null, count, ratings: [{ id, stars, comment, created_at, rater: { name } }], limit, offset }`; 404 unknown or non-`open` seller (`"Mitra tidak ditemukan."`) |

- [ ] T-057.1 [backend] `farmer_rating` model + `rateFarmerWorkflow` + `POST /store/won-lots/:id/rating` + `rating` on the won-lot rows
- [ ] T-057.1b [backend] `GET /store/ratings` aggregate for the public farm page
- [ ] T-057.2 [storefront] Rating sheet on a `shipped`+ won lot
- [ ] T-057.3 [storefront] Ratings block on `mitra/[handle]`
- [ ] T-057.4 [qa] Once per lot; only the winner; only at/after `shipped`; nothing PII in the payload

#### Briefs

```text
Story: US-057 (task T-057.1)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria
- AC1: Available once the lot is `shipped`: 1–5 stars and a comment, once per lot.

## Decisions in force
D-058: a rating moves no money — no wallet read, no ledger row, no payout.
D-055: Indonesian messages; the app keys on `code`/status, never message text.
D-042/D-045: the row returns no customer id, phone, NIK or email; the rater is a
first name only. D-039 stands (name is the permitted display value).
CLAUDE.md §8: one workflow with compensation; one row per lot enforced by the DB.

## Build
- Model src/modules/moderation/models/farmer-rating.ts:
  `FarmerRating { id: model.id({ prefix: "frat" }).primaryKey(), lot_id: text,
  customer_id: text, seller_id: text, stars: model.number(), comment: text().nullable() }`.
  Unique index `{ on: ["lot_id"], unique: true }`, indexes `{ on: ["seller_id", "created_at"] }`.
  Soft references only (§9). Add `FarmerRating` to the `MedusaService({...})`
  call in modules/moderation/service.ts (keep every model already listed);
  migration `bunx medusa db:generate moderation`.
- Guard step `getRateableLotStep({ lot_id, customer_id })`, read only, under the
  `lot:<id>` lock: `query.graph` lot fields `id, status, winner_customer_id,
  auction.seller_id`. Missing lot, or `winner_customer_id !== customer_id` →
  NOT_FOUND "Lot tidak ditemukan." (no existence leak). `status` not in
  `["shipped","delivered","claimed"]` → CONFLICT "Lot ini belum dikirim, jadi
  belum bisa dinilai." code `lot_not_shipped`. Returns `seller_id`.
- Insert step `createFarmerRatingStep`: `createFarmerRatings([...])`; catch
  `code === "23505"` → CONFLICT "Anda sudah menilai lot ini." code
  `rating_exists` (copy `createClaimStep`, steps/claim.ts:321-347). Compensation
  deletes the row.
- Workflow src/workflows/rate-farmer.ts `{ lot_id, customer_id, stars, comment }`:
  lock `lot:<id>` → guard → insert → release; return the row.
- Route src/api/store/won-lots/[id]/rating/route.ts: identity from
  `req.auth_context.actor_id`; 201 `{ rating: { id, lot_id, stars, comment,
  created_at } }`. Strict body via zod, imported from a new
  api/store/won-lots/[id]/rating/validators.ts.
- Won-lot read: in api/store/won-lots/route.ts `readWonLotExtras`, add the
  caller's ratings for the page's lot ids to the one batched query (same shape as
  the existing claim read, :207-225) and map `rating: {...} | null` into
  `WonLot`/`toWonLot`; the `:id` route reads the same extras.
- middlewares.ts: `{ method: ["POST"], matcher: "/store/won-lots/:id/rating",
  middlewares: [authenticate("customer", ["bearer","session"]),
  validateAndTransformBody(StoreRateLot)] }`. `bun run codegen`.

## Start from
- packages/api/src/workflows/open-claim.ts (lock, guard, insert, 23505, compensation)
- packages/api/src/workflows/steps/claim.ts:321-347 (unique-race 409)
- packages/api/src/api/store/won-lots/route.ts:190-260 (batched extras, the
  `claim` field added the same way)

## Do not touch
- apps/**; the claim model/workflows; any auction, lot or wallet code; US-059/060/061

## Spec (packages/api/integration-tests/http/lot-rating.spec.ts)
Seed a closed lot per case through the module service (winner = the test customer).
- `shipped` + stars 5 + comment → 201, row saved; module read agrees
- second POST → 409 `rating_exists`, still one row
- `delivered` and `claimed` → 201 (the pinned window)
- `open` / `unsold` / `won` / `paid` / `cancelled` → 409 `lot_not_shipped`, no row
- another customer's lot (not the winner) → 404, no row; unknown id → 404
- stars 0, 6, 2.5, or a missing `stars` → 400; 301-character comment → 400; strict body
- no customer token → 401
- `GET /store/won-lots` then carries `rating` on that row and null on another
- forced failure after the insert → row deleted (compensation)
- serialised JSON has no customer id, phone, email, NIK or address

## Cross-cutting checklist
- [ ] PII: first name only, no id/phone/email/NIK anywhere (D-042/D-045); self
      customer fields stay as they are
- [ ] D-055: the two 409 codes and the 404 message in Indonesian
- [ ] No money, no ledger row, no payout (D-058)
- [ ] One mutation per step with compensation; timestamps from the server
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated rating route name
cd packages/api && bun run test:integration:http -- lot-rating → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (route, body, 201 shape, every error) +
migration name + the won-lot `rating` field.
```

```text
Story: US-057 (task T-057.1b)   Release: mvp
Agent: backend   Expected: <=30 min
Starts after: T-057.1 (model and rows).

## Acceptance criteria
- AC2: Ratings show on the farm's page (`mitra/[handle]`).

## Decisions in force
D-042/D-045: rater first name only; no customer id, phone or email.
D-046/D-061: a suspended farm is not public; `GET /store/sellers` returns only
`open` sellers, so a non-open seller is 404 here too. D-055: Indonesian messages.

## Build
- src/api/store/ratings/validators.ts: `StoreGetRatingsParams` — `seller_id`
  (required string), `limit` default 10 max 50, `offset` default 0.
- src/api/store/ratings/route.ts (public: publishable key, no customer token):
  1. read the seller `{ id, status }` by id; missing or `status !== "open"` →
     NOT_FOUND "Mitra tidak ditemukan."
  2. `query.graph` `farmer_rating` fields `id, stars, comment, created_at,
     customer_id`, filters `{ seller_id }`, order `created_at DESC`, paged.
  3. one batched customer read for the page's `customer_id`s →
     `customer.first_name` only.
  4. `average`: mean of all the seller's ratings to one decimal
     (`Math.round(sum/count*10)/10`), null when count is 0; `count` from
     `metadata.count`.
  5. `{ average, count, ratings: [{ id, stars, comment, created_at,
     rater: { name } }], limit, offset }`. Never select phone, email, NIK or the
     customer id into the response.
- middlewares.ts: `{ method: ["GET"], matcher: "/store/ratings", middlewares:
  [validateAndTransformQuery(StoreGetRatingsParams, { defaults: [], isList: true,
  defaultLimit: 10 })] }`. `bun run codegen`.

## Start from
- packages/api/src/api/store/lots/route.ts (public read, paged, batched joins)
- packages/api/src/api/vendor/claims/route.ts:47-67 (`winnersById`, the same
  name-only batched read)

## Do not touch
- apps/**; Mercur's `/store/sellers*`; the rating write (T-057.1)

## Spec (append to packages/api/integration-tests/http/lot-rating.spec.ts)
- three ratings on seller A, one on seller B → A returns count 3, its average,
  newest first; B's row absent
- zero ratings → `average: null`, `count: 0`, `ratings: []`
- unknown seller id and a `suspended` seller → 404 "Mitra tidak ditemukan."
- `limit`/`offset` page correctly; `limit` > 50 → 400
- serialised JSON has no customer id, phone, email or NIK

## Cross-cutting checklist
- [ ] PII: first name only (D-042/D-045)
- [ ] D-055: the 404 message in Indonesian
- [ ] Read only: no workflow needed, no writes
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated ratings route name
cd packages/api && bun run test:integration:http -- lot-rating → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (query, 200 shape, 404) + the average rule.
```

```text
Story: US-057 (task T-057.2)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=40 min
Starts after: T-057.1 and its codegen.

## Acceptance criteria
- AC1 (winner half): the winner can rate a `shipped` lot, once.

## Decisions in force
D-055: a 409 body is rewritten by Medusa, so the app writes its own copy and
keys on status/code. D-042/D-045: nothing about the rater leaves the form.
D-058: no money text anywhere on this screen.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/won-lots | yes | rows gain `rating: { id, stars, comment, created_at } \| null` (T-057.1) |
| POST | /store/won-lots/:id/rating | no → T-057.1, first | `{ stars, comment? }` → 201 `{ rating }`; 404; 409 `lot_not_shipped` / `rating_exists` |
| GET | /store/ratings?seller_id= | no → T-057.1b | used by T-057.3 only |

## Build (one surface: a won-lot row on `/akun/menang`)
- src/lib/helpers/lot-rating.ts (+ .test.ts): `canRateLot({ status, rating })` →
  `{ show: boolean }` (status in `shipped|delivered|claimed`, no `rating` yet);
  `ratingFailureInfo({ status, code, message })` → 409 `rating_exists`
  "Lot ini sudah dinilai. Halaman diperbarui." (refresh); 409 `lot_not_shipped`
  "Lot ini belum dikirim, jadi belum bisa dinilai." (refresh); 404
  "Lot ini tidak ditemukan." (refresh); else the server's message.
- src/lib/data/lots.ts: `rateLot(id, { stars, comment })` beside the delivered
  action, same result shape and `revalidatePath(ROUTES.wonLots)`; extend the
  `WonLot` type with `rating`.
- src/components/sections/AccountPage/components/RateFarmer.tsx: client sheet
  copied from `ReviewForm.tsx` (StarsInput via `Controller`, bare textarea ≤300,
  zod schema with 1–5 required). Submit → toast "Terima kasih, penilaian
  terkirim." → `router.refresh()`. Busy state on the button.
- WonLotsPage.tsx row: when `canRateLot(...).show` draw "Nilai kebun"; when
  `rating` exists draw `Sudah dinilai — ★{stars}` and no button. Never show a
  button on `won`/`paid`.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/ReviewForm.tsx
- apps/storefront-koi/src/components/sections/AccountPage/WonLotsPage.tsx:100-200
- apps/storefront-koi/src/lib/helpers/review-subjects.test.ts (test style)

## Do not touch
- packages/api; apps/admin-koi; the claim block; `ReviewForm` itself

## Cross-cutting checklist
- [ ] D-055: 409/404 copy is the app's own; never key on message text
- [ ] No PII in the form; no money text (D-058)
- [ ] Uses `@koi/ui` + existing atoms; no raw `fetch`
- [ ] UI task: render check on `/akun/menang`, one submit (render-check skill)
- [ ] `bun run check` clean

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/menang as a seeded winner with one `shipped` lot, one
`delivered` lot already rated, one `won` lot — psql): button only on `shipped`
and unrated; submit → "Sudah dinilai — ★5"; a second submit path is not offered
→ clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-057 (task T-057.3)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=35 min
Starts after: T-057.1b and its codegen.

## Acceptance criteria
- AC2: Ratings show on the farm's page (`mitra/[handle]`).

## Decisions in force
D-042/D-045: the rater is a first name from the server; nothing else.
D-046/D-061: the page already 404s a non-public seller — keep that path.
`lib/adapters/seller.ts:11-15`: never invent zeroes; hide the block instead.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /store/sellers | yes | the page's existing seller read, unchanged |
| GET | /store/ratings?seller_id=:id | no → T-057.1b | `{ average, count, ratings: [{ id, stars, comment, created_at, rater: { name } }] }`; 404 |

## Build (one surface: the identity band's reviews block)
- src/lib/data/ratings.ts: `listSellerRatings(sellerId, limit = 6)` in the same
  shape as the other public reads; a failure returns `{ average: null, count: 0,
  ratings: [] }` so the page still renders.
- PartnerPage.tsx: one extra parallel read; pass `ratings` to `Partner`.
- components/PartnerPage/components/Partner.tsx: below the identity band, a
  "Penilaian" block drawn only when `count > 0`: `{average formatted id-ID} ·
  {count} penilaian`, then each of the latest 6 as stars (`<Stars value>`),
  first name, `formatAgo(created_at)`, and the comment as text (never HTML).
- No star block on the directory cards; no pagination in this task.

## Start from
- apps/storefront-koi/src/components/sections/PartnerPage/components/Partner.tsx
- apps/storefront-koi/src/components/atoms/Stars/Stars.tsx
- apps/storefront-koi/src/lib/helpers/format-ago.ts

## Do not touch
- packages/api; apps/admin-koi; the shelf/pagination; the seller adapter

## Cross-cutting checklist
- [ ] No PII beyond the server's first name; never print an id (D-042/D-045)
- [ ] Nothing rendered as HTML (`dangerouslySetInnerHTML` is banned here)
- [ ] Empty/error state hides the block (no "0,0", no layout hole)
- [ ] UI task: render check on `/mitra/<handle>` for a rated and an unrated farm
- [ ] `bun run check` clean; no raw `fetch`

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/mitra/sakura-koi-farm with 3 seeded ratings; one unrated farm):
average and count, three rows, comments as text; unrated farm shows no block,
no "NaN"/"undefined" → clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-057 (task T-057.4)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC2. Decisions: D-042/D-045, D-055, D-058. Code under test:
src/modules/moderation/models/farmer-rating.ts, workflows/rate-farmer.ts,
steps/farmer-rating.ts, api/store/won-lots/[id]/rating/route.ts,
api/store/ratings/route.ts, the two screens.
Commands (alone): bun run test:integration:http -- lot-rating. Then bun run
check in storefront-koi.
Seeding: lots and ratings through the module service; the browser's `shipped`
lot state with psql.
Browser (render-check): winner rates on /akun/menang; the farm page shows the
rating with the rater's first name only.
Watch for: a rating from anyone but the winner (must be 404); a rating on `won`
or `paid` (409); a second rating creating a second row; stars outside 1–5
accepted; a comment over 300 stored; any customer id, phone, email or NIK in a
payload or the page source; any money/ledger row; an invented "0,0" average.
Do not change app code. Report PASS/FAIL per AC with file:line and command
output; bugs with repro and expected/actual.
```

**Coverage:** AC1 → T-057.1, T-057.2, T-057.4; AC2 → T-057.1b, T-057.3,
T-057.4. Plan "Ratings" is fully covered. `mvp-Q48` (window, comment
requiredness) is non-blocking; the defaults above are what the briefs build.

### US-058 Farmer reports a winner who didn't pay · `todo` (unparked 2026-11-17 by D-058; briefs written 2026-11-17)
**D-058 sets the deadline.** The winner pays the farmer directly, off-platform,
within 1×24 h of the lot closing, so the deadline is `closed_at` + 24 h (the same
`pay_by` the winner's won-lot rows show, `store/won-lots/route.ts:102,136`). The
2026-11-16 escrow note is void: there is no invoice expiry, and the farmer reports
once that deadline passes.
As a **farmer**, I want to report a winner who didn't pay within 1×24 h so that
admin can act. *(Plan: Winner doesn't pay; D-026, D-058)*
- AC1: The farmer can report after the deadline. The admin reviews it and may give a strike.
- AC2: Any offer to the second-highest bidder is fully off-platform. The platform records nothing about it and never reassigns the lot; winner and final price stay as saved at close (D-026).
- [ ] T-058.1 [backend] `lot_report` model (one per lot) + `reportUnpaidLotWorkflow` + `POST /vendor/sold-lots/:id/report` + `pay_by`/`unpaid` on the sold-lot row
- [ ] T-058.2 [storefront] "Laporkan belum dibayar" on a `won` sold lot once the deadline passes
- [ ] T-058.3 [backend] `GET /admin/reports` (queue by status, per-winner by `winner_id`), names only
- [ ] T-058.4 [admin] `/laporan` queue and a `/pengguna` "Laporan belum dibayar" tab (read-only; the strike is US-059 T-059.2)
- [ ] T-058.5 [qa] The deadline gates the report; a second report is refused; the lot never changes; nothing about a second bidder is stored or shown

**Readiness 2026-11-17: ready (`todo`). Nothing blocks it, and no new question.**
- The deadline source is decided and already in the tree: `lot.closed_at` (US-050) + 24 h,
  the same `PAY_WINDOW_MS` the winner's row uses. No setting, no new column for it.
- D-026/D-037 fix what a report is: a record, never a lot change. D-027/D-038 govern only
  claims; a lot report adds no claim state.
- US-056's non-blocking `mvp-Q47` does not touch this story.

**What the report needs, pinned:**

| Question | Answer | Source |
|---|---|---|
| Which lot statuses qualify | `won` only. `paid`/`shipped`/`delivered`/`claimed` → 409 (the farmer was paid); `open`/`unsold`/`cancelled` → 409 (no winner) | D-058's `won → paid`; plan "Lot lifecycle" |
| The deadline source | `closed_at` + 24 h, one shared constant, compared on the server; the app only mirrors it to hide the button | D-058; `store/won-lots/route.ts:102` |
| Does a report change the lot? | **No.** `status` stays `won`; `winner_customer_id` and `final_price` untouched; the lot is never reassigned, and no second-bidder offer is recorded | D-026 (AC2); CLAUDE.md §8 |
| Is there a report status? | One value, `open`. Only the admin leaves it, by giving a strike (US-059); the farmer has no transition after reporting | D-037; plan "Strikes" |
| Idempotent? | **Yes, one report per lot** (unique index on `lot_id`); a second POST → 409 `lot_already_reported`, no second row | mvp-Q44's one-per-lot shape |
| Does the report warn or punish the winner? | No. No notification, no ban, no strike on report; the admin acts | plan "Strikes" |
| Money | None. No refund, no ledger row, no payout; a refund the farmer chooses is paid directly and is not recorded | D-058 |

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /vendor/sold-lots/:id/report | **no** (T-058.1) | no body → 201 `{ report: { id, lot_id, status: "open", pay_by, reported_at } }`; 403 pending/rejected/terminated; 404 another farm's lot; 409 `lot_not_payable` / `pay_deadline_not_passed` / `lot_already_reported` |
| GET | /vendor/sold-lots | yes | rows gain `pay_by: string \| null` and `unpaid: { reported_at: string } \| null` (T-058.1) |
| GET | /admin/reports?status=open | **no** (T-058.3) | `{ reports: [{ id, lot_id, status, reported_at, pay_by, winner: { name }, seller: { name }, product: { title, thumbnail } }], count, limit, offset }` |
| GET | /admin/reports?winner_id=:id | **no** (T-058.3) | same rows, all time (D-037) |

#### Briefs

```text
Story: US-058 (task T-058.1)   Release: mvp
Agent: backend   Expected: <=45 min
Starts after: US-052 T-052.4 (`won` is a reachable state), D-058 in force.

## Acceptance criteria
- AC1: The farmer can report after the deadline. The admin reviews it and may give a strike.
- AC2: Any offer to the second-highest bidder is fully off-platform. The platform records nothing about it and never reassigns the lot; winner and final price stay as saved at close (D-026).

## Decisions in force
D-058: the deadline is `closed_at` + 24 h compared on the server; no money moves.
D-026: the report records only that the farmer reported; the lot keeps `won`, its
`winner_customer_id` and `final_price`; nothing about a second bidder is stored.
D-037: one report = one "unpaid win" (US-071's shill table reads this table); no count
column here. D-054 literal: the paid/shipped exception does not cover this route, so it
runs `validateSellerOpenStep` first and a suspended farm gets 403 — say so in the report
(likely D-060-style follow-up, not a blocker). D-003: seller from `req.seller_context`.
D-055: Indonesian messages. CLAUDE.md §9: thin module, thin typed route; §8: workflow with
compensation, server clock.

## Build
- New model src/modules/moderation/models/lot-report.ts:
  `LotReport { id: model.id({ prefix: "lrep" }).primaryKey(), lot_id: text, seller_id: text,
  winner_customer_id: text, status: model.enum(["open"]).default("open") }`.
  Indexes `{ on: ["lot_id"], unique: true }`, `{ on: ["winner_customer_id"] }`,
  `{ on: ["seller_id", "status"] }`. Soft references only. Register it:
  `MedusaService({ Claim, LotReport })` in service.ts. Migration
  (`bunx medusa db:generate moderation`).
- One constant: move `PAY_WINDOW_MS` out of `api/store/won-lots/route.ts:102` into
  `src/utils/pay-window.ts` (`export const PAY_WINDOW_MS = 24 * 60 * 60 * 1000`) and import
  it in both the won-lots route and this workflow — one number, not two.
- steps/lot-report.ts:
  - `getReportableLotStep({ seller_id, lot_id })`, read only, under the `lot:<id>` lock:
    `query.graph` on `lot` fields `id, status, closed_at, winner_customer_id,
    auction.seller_id`; missing or `auction.seller_id !== seller_id` → NOT_FOUND "Lot tidak
    ditemukan."; `status !== "won"` → CONFLICT "Lot ini tidak bisa dilaporkan." code
    `lot_not_payable`; no `closed_at` → CONFLICT same code; `Date.now() < closed_at + pay
    window` → CONFLICT "Batas waktu pembayaran belum lewat." code `pay_deadline_not_passed`.
  - `createLotReportStep({ lot_id, seller_id, winner_customer_id })`: insert one row; catch
    `code === "23505"` → CONFLICT "Lot ini sudah dilaporkan." code `lot_already_reported`
    (createClaimStep shape, steps/claim.ts:321-347). Compensation deletes the row.
- Workflow src/workflows/report-unpaid-lot.ts `{ seller_id, lot_id }`: lock → `validateSellerOpenStep`
  → guard → create → release; return the row.
- Route src/api/vendor/sold-lots/[id]/report/route.ts: body-less, strict empty body (paid/route.ts:24-31),
  `{ report: { id, lot_id, status, pay_by, reported_at } }` with `pay_by` = closed_at + 24 h
  ISO and `reported_at` = the row's `created_at` ISO (no extra column). Import
  `.../types/seller-context`.
- `GET /vendor/sold-lots` (route.ts): read the page's reports in one `query.graph` on
  `lot_report` filtered by the page's lot ids; add `pay_by` (closed_at + 24 h, ISO or null)
  and `unpaid: { reported_at } | null` to `SoldLot` and `toSoldLots`.
- middlewares.ts: no entry (no body; Mercur's `/vendor/*` catch-all authenticates and
  resolves `seller_context`). `bun run codegen`.

## Start from
- packages/api/src/workflows/open-claim.ts + steps/claim.ts:321-347 (lock, guard, insert,
  23505 → 409, compensating delete)
- packages/api/src/workflows/mark-lot-sold-status.ts:87-118 (`getPayableLotStep`: same
  ownership + status shape)
- packages/api/src/api/vendor/sold-lots/route.ts (the row mapper to extend)

## Do not touch
- apps/**; the claim model or workflows; any lot column (`status`, `winner_customer_id`,
  `final_price`); wallet, ledger or payout code; US-059's strike work

## Spec (packages/api/integration-tests/http/vendor-unpaid-report.spec.ts)
Seed a closed `won` lot through the module service with `closed_at` set.
- `closed_at` = now − 25 h, status `won` → 201, row `open`; module read agrees
- second POST → 409 `lot_already_reported`, still one row
- `closed_at` = now − 23 h → 409 `pay_deadline_not_passed`, no row
- `paid` / `shipped` / `delivered` → 409 `lot_not_payable`, no row; `open` / `unsold` /
  `cancelled` → same
- another seller's lot → 404, no row; unknown id → 404
- pending / rejected / terminated farm → 403; suspended-after-approval farm → 403 (D-054
  literal, which names paid and shipped only — note it in the report)
- no member token / no `x-seller-id` → 401
- after the report: lot `status` still `won`, `winner_customer_id` and `final_price`
  unchanged; no `wallet_transaction` row; no second-bidder field anywhere
- `GET /vendor/sold-lots` then carries `pay_by` and `unpaid.reported_at` on that row and
  `unpaid: null` on another
- forced failure after the insert → row deleted (compensation)
- serialised JSON has no video key, URL, phone, address, customer id or amount

## Cross-cutting checklist
- [ ] `validateSellerOpenStep` first (D-054 names paid/shipped only; say so in the report)
- [ ] PII: no customer id, phone, address or email in any response (D-042/D-045/D-052)
- [ ] D-055: Indonesian messages for all three 409s and the 404
- [ ] No money, ledger row or payout (D-058); the lot is never changed (AC2)
- [ ] One mutation per step with compensation; timestamps from the server
- [ ] Route imports `.../types/seller-context`; `bun run codegen`; `bun run tsc` clean in
      BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated report route name
cd packages/api && bun run test:integration:http -- vendor-unpaid-report → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (route, body, 201 shape, every error status + code)
+ migration name + the two new sold-lot row fields.
```

```text
Story: US-058 (task T-058.2)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=35 min
Starts after: T-058.1 and its codegen.

## Acceptance criteria
- AC1 (farmer half): the farmer can report once the deadline has passed.

## Decisions in force
D-058 (deadline `closed_at` + 24 h, carried as `pay_by`), D-055 (a 409 body is rewritten →
the app writes its own copy; key on status), D-052 (no winner phone/address), D-026 (the
report changes nothing about the lot).

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /vendor/sold-lots | yes | rows gain `pay_by: string \| null` and `unpaid: { reported_at } \| null` (T-058.1) |
| POST | /vendor/sold-lots/:id/report | no → T-058.1, first | no body → 201 `{ report: { id, lot_id, status: "open", pay_by, reported_at } }`; 403; 404; 409 `lot_not_payable` / `pay_deadline_not_passed` / `lot_already_reported` |

## Build (one surface: a `won` sold-lot row on `/akun/kebun/terjual`)
- src/lib/helpers/sold-lot-actions.ts (+ .test.ts): `canReportUnpaid({ status, payBy,
  reportedAt, now })` → `{ show: boolean }` (status `won`, `pay_by` passed, no report yet);
  `unpaidFailureInfo({ status, code, message })` → 409 "Laporan tidak bisa dikirim. Halaman
  diperbarui." (refresh), 404 "Lot ini tidak ditemukan." (refresh), 403 the server's
  Indonesian message, else the server's message.
- SoldLotsPage.tsx `won` row: when `canReportUnpaid(...).show` draw "Laporkan belum
  dibayar" (client component `ReportUnpaid.tsx` copied from `MarkPaid.tsx`: confirm
  "Pemenang belum membayar sampai batas waktu? Laporkan ke admin." → busy → toast "Laporan
  dikirim." → `router.refresh()`). When `unpaid` is present show "Dilaporkan {reported_at}"
  and keep "Tandai sudah dibayar" (a late payment still settles the lot; the report never
  blocks it). No amount, no refund or strike wording.
- src/lib/data/sold-lots.ts: `reportUnpaidLot(id)` beside `markSoldLotPaid`, same result
  shape and `revalidatePath(ROUTES.farmSold)`; extend the `SoldLot` type.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/MarkPaid.tsx
- apps/storefront-koi/src/lib/helpers/sold-lot-actions.ts:49-74
- apps/storefront-koi/src/components/sections/AccountPage/SoldLotsPage.tsx:260-340

## Do not touch
- packages/api; apps/admin-koi; WonLotsPage; the claim block

## Cross-cutting checklist
- [ ] D-055: 409/404 copy is the app's own; never key on message text
- [ ] PII unchanged: winner's name only, no phone or address (D-052)
- [ ] No money, amount, refund or strike text (D-058, US-059)
- [ ] Button visibility reads the server's `pay_by`, never a client-side 24 h guess
- [ ] UI task: render check on `/akun/kebun/terjual`, one report submit (render-check skill)
- [ ] `bun run check` clean; no raw `fetch`

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/kebun/terjual as sakura.koi.farm@koi.dev, one `won` lot with
`closed_at` 25 h old and one 2 h old, set with psql): the button appears only on the old
row, submit → "Dilaporkan …" and the pay action still present → clean; screenshot path
reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-058 (task T-058.3)   Release: mvp
Agent: backend   Expected: <=30 min
Starts after: T-058.1 (the `lot_report` model and its rows).

## Acceptance criteria
- AC1 (admin half): the admin can review a report. The strike is US-059.

## Decisions in force
D-002 (routes under `/admin/*`, admin-authenticated by Medusa's default), D-026 (no
second-bidder field exists, so none is shown), D-037 (counts cover all time), D-042/D-045
(the winner is a name only; the admin gains no way to read a customer id, phone or email),
D-055 (Indonesian messages).

## Build
- src/api/admin/reports/validators.ts: `AdminGetReportsParams` — `status: z.enum(["open"])
  .optional().default("open")`, `winner_id: z.string().optional()`, `limit`/`offset` exactly
  like `AdminGetClaimsParams`.
- src/api/admin/reports/route.ts, copying `api/admin/claims/route.ts`: one `query.graph` on
  `lot_report` (`id, lot_id, status, created_at, winner_customer_id, seller_id`), filtered
  by status and/or winner_id, newest first; then reuse `readClaimLotInfo` and
  `winnersById` (import from `../vendor/claims/route`) for product title/thumbnail, farm
  name and winner name. Rows: `{ id, lot_id, status, reported_at, pay_by, winner: { name },
  seller: { name }, product: { title, thumbnail } }`; `pay_by` = the lot's `closed_at` +
  `PAY_WINDOW_MS` (import the constant from T-058.1); `reported_at` = the row's `created_at`
  ISO. Never select a phone, email or address.
- middlewares.ts: `GET /admin/reports` → `validateAndTransformQuery(AdminGetReportsParams,
  { defaults: [], isList: true, defaultLimit: 20 })`. `bun run codegen`.

## Start from
- packages/api/src/api/admin/claims/route.ts (the merged row to copy)
- packages/api/src/api/vendor/claims/route.ts (`readClaimLotInfo`, `winnersById`)

## Do not touch
- apps/**; the report workflow or model (T-058.1); the claim routes; US-059

## Spec (packages/api/integration-tests/http/admin-reports-read.spec.ts)
Seed two `open` reports (and one on another winner) through the module service.
- `?status=open` returns both, newest first, with the winner's and farm's names, no customer
  id, no phone; `pay_by` = lot `closed_at` + 24 h
- `?winner_id=<id>` returns only that winner's reports, all time
- a report whose lot was later `paid` is still listed (the report is a record)
- no admin token → 401/403
- serialised JSON has no customer id, phone, email, address or amount

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated reports route name
cd packages/api && bun run test:integration:http -- admin-reports-read → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (both queries, 200 shape, errors).
```

```text
Story: US-058 (task T-058.4)   Release: mvp
Agent: frontend (admin-koi)   Expected: <=45 min
Starts after: T-058.3 and its codegen. Two surfaces (the queue and the per-account tab) read
one route. The strike button is NOT here (US-059 T-059.2).

## Acceptance criteria
- AC1 (admin half): the admin reviews the report. The strike is US-059.

## Decisions in force
D-002 (this app only, `/admin/*`), D-026 (nothing about a second bidder is stored or
shown), D-037 (every count covers all time), D-042/D-045 (the winner is a name only; an
admin gains no new way to read a customer id), D-055 (Indonesian copy). admin-koi rule: a
punishing action needs a written reason — that action is US-059's, so this screen is
read-only.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /admin/reports?status=open | yes (T-058.3) | `{ reports: [{ id, lot_id, status, reported_at, pay_by, winner: { name }, seller: { name }, product: { title, thumbnail } }], count, limit, offset }` |
| GET | /admin/reports?winner_id=:id | yes (T-058.3) | same rows, all time (D-037) |

## Build
- src/const/routes.ts: `reports: '/laporan'`. src/const/nav.ts: an "Antrean" item "Laporan
  belum dibayar", `ready: true`. Leave `/pengguna` `ready: false` unless you also build the
  tab (optional if time runs short — say so).
- src/app/(app)/laporan/page.tsx: `requireAdmin(ROUTES.reports)`, one read,
  `ReportQueue.tsx` (copy `ClaimQueue.tsx`'s row: product title + thumbnail, farm name,
  reported time, `pay_by`, badge "Terbuka"). Empty copy "Tidak ada laporan menunggu."
- src/lib/data/reports.ts: `listReports(status, limit, offset)` and
  `listWinnerReports(winnerId)`, each calling `requireAdmin(ROUTES.reports)` first, with the
  same narrowing cast as `listClaims`.
- src/lib/helpers/report-format.ts (+ .test.ts): status label, `formatReportedAt`,
  `reportDeadlineLabel(payBy)`.

## Start from
- apps/admin-koi/src/components/ClaimQueue.tsx (row to copy)
- apps/admin-koi/src/app/(app)/klaim/page.tsx (page shape)
- apps/admin-koi/src/lib/data/claims.ts (guarded read + cast)

## Do not touch
- apps/storefront-koi; US-059's strike model/actions; the claim queue's behaviour

## Cross-cutting checklist
- [ ] D-002: every server action calls `requireAdmin(ROUTES.reports)` itself
- [ ] PII: names only — no customer id, phone, email or address (D-042/D-045/D-052)
- [ ] D-055: Indonesian copy
- [ ] No strike action, no money, no second-bidder field (D-026, US-059)
- [ ] UI task: render check on `/laporan` with two seeded reports
- [ ] `bun run check` clean; no raw `fetch`

## Definition of done
cd apps/admin-koi && bun run check → pass
render check (http://127.0.0.1:3002/laporan as admin@koi.dev, two seeded `open` reports):
both rows show winner name, farm, reported time and deadline; no phone or customer id in
the page source → clean; screenshot path reported.
Report: standard header + the route's API contract + render check result + screenshot path.
```

```text
Story: US-058 (task T-058.5)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC2. Decisions: D-026, D-037, D-054, D-058, D-055, D-042/D-045/D-052.
Code under test: packages/api/src/modules/moderation/models/lot-report.ts,
src/workflows/report-unpaid-lot.ts, src/workflows/steps/lot-report.ts,
src/api/vendor/sold-lots/[id]/report/route.ts, src/api/vendor/sold-lots/route.ts,
src/api/admin/reports/route.ts, and the two screens.
Commands (alone): bun run test:integration:http -- vendor-unpaid-report; then --
admin-reports-read. Then bun run check in both Koi apps.
Seeding: a closed `won` lot through the module service with `closed_at` set; for the browser
set `closed_at` with psql (never a test route).
Browser (render-check): farmer reports on /akun/kebun/terjual after the deadline → row reads
"Dilaporkan …" and "Tandai sudah dibayar" is still offered; the admin sees it on /laporan.
Watch for: a report before the deadline returning 201; a second report creating a second
row; a `paid`/`shipped` lot accepted; the lot's `status`, `winner_customer_id` or
`final_price` changing (AC2); any second-bidder field, amount, ledger row or money text; a
customer id, phone, email or address in any response or page source; a suspended farm
reporting (403 per D-054 literal — if the code allows it, say which rule it applies rather
than failing silently); a report that gives a strike or bans anyone (US-059's).
Do not change app code. Report PASS/FAIL per AC with file:line and command output; bugs
with repro and expected/actual.
```

**Coverage:** AC1 → T-058.1/.2/.3/.4; AC2 → T-058.1 (no lot change, no second-bidder
field), T-058.4 (nothing shown about an offer), T-058.5. Plan "Winner doesn't pay" and the
report half of "Strikes" are covered here; the strike and ban are US-059.

### US-059 Strikes and bans · `todo` (the "winner didn't pay" strike part is back in scope, 2026-11-17, D-058)
As an **admin**, I want to give strikes after checking a report so that repeat
offenders are banned. *(Plan: Strikes; D-058)*
- AC1: Admin gives each strike with a reason (winner: didn't pay; farmer: didn't ship a paid lot, or refused an approved claim). *(The "winner didn't pay" reason is in scope again: D-058 restores the 1×24 h deadline (`closed_at` + 24 h, US-058) and the farmer's report, so all three reasons build.)*
- AC2: 2 active strikes = ban. A banned winner can't join or bid. A banned farmer can't create auctions.
- AC3: Strikes expire after 6 months. Admin can remove a strike with a reason.
- AC4: Every ban and every suspend needs a written reason, the same rule as a farm rejection (D-041). admin-koi refuses the action without one.
- [ ] T-059.1a [backend] `strike` model + migration + give/remove workflows + three admin routes + `active_strikes`/`banned` on the report and claim rows
- [ ] T-059.1b [backend] `assertNotBannedStep` wired into join, bid and create-auction (D-047's deferred checks)
- [ ] T-059.2 [admin] Strike button on a `/laporan` row and on an overdue `/klaim` row, plus the user's strike history and remove action
- [ ] T-059.3 [qa] Expiry, removal lifting the ban, and all three refused actions (US-041 AC4, US-042 AC1 ban clauses)

**Readiness 2026-11-18: ready (`todo`). Nothing blocks it. One new question,
non-blocking (`mvp-Q49`), with the build default pinned below.**
- **A strike is one row in a new `strike` table**, written only by an admin after
  checking a report or an overdue claim: `customer_id` (the account, D-003 — a
  farmer and a winner are the same identity), optional `seller_id` and `lot_id`,
  `reason_type`, a required Indonesian `reason` (D-041), `created_by` (admin),
  and the row's own `created_at`. Removing a strike writes `removed_at`,
  `removed_by`, `removed_reason` on that row — nothing is deleted, and nothing is
  written to the wallet (D-058: no money, no ledger row, no payout).
- **There is no ban table.** AC2's "2 active strikes = ban" is a derived state:
  **active** = not removed **and** `created_at` newer than 6 months (AC3). A ban
  is `active_count >= 2`, computed by one read helper. Removing a strike or
  letting one expire drops the count and lifts the ban with no separate action,
  so nothing can drift out of sync. `mvp-Q49` asks whether the ban should instead
  be an explicit admin action; the build follows AC2 literally (automatic at the
  second active strike, with the second strike's own written reason as the ban's
  reason, so D-041 is satisfied).
- **Ban checks do not exist yet at join or bid.** Verified: `steps/join-fee.ts:20`
  and `steps/bid.ts:42` both carry a `ponytail:` naming US-059 T-059.1 as where
  the check lands (D-047). This story adds them; US-041 AC4's and US-042 AC1's
  ban clauses are verified here, not there.
- **What a ban blocks (AC2 only):** joining an auction, placing a bid, and
  creating an auction. Not rating a farmer (US-057), marking a won lot delivered,
  opening or deciding a claim, marking a sold lot paid or shipped (D-054/D-060
  stand), or reading anything.
- **A customer ban does not suspend the farm.** D-054/D-060 exceptions are
  untouched; a banned farmer still has the seller status they had. The ban blocks
  creation through the strike count, not through Mercur's seller status.

**The three strike reasons, pinned:**

| `reason_type` | Who | Where the admin acts | Backing |
|---|---|---|---|
| `winner_unpaid` | winner | `/laporan` (US-058 report row) | report exists and `closed_at + 24 h` passed (D-058) |
| `farmer_not_shipped` | farmer | the admin's own record page; no queue row in the MVP, so the API accepts `lot_id` directly | plan "Strikes"; no shipping deadline exists, so it is an admin judgment (noted in `mvp-Q49`) |
| `farmer_claim_refused` | farmer | `/klaim` approved tab (US-056 T-056.3 flag) | approved claim past 3 days, or a refusal not acted on (`mvp-Q47` option a) |

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /admin/strikes | **no** (T-059.1a) | body `{ customer_id?, seller_id?, lot_id?, reason_type, reason }` → 201 `{ strike: { id, customer_id, seller_id, lot_id, reason_type, reason, created_at, removed_at }, ban: { active_count, banned } }`; 400 `"Alasan strike wajib diisi."` / `"Jenis strike tidak dikenal."`; 404 `"Akun pemilik kebun tidak ditemukan."` / `"Lot tidak ditemukan."` |
| POST | /admin/strikes/:id/remove | **no** (T-059.1a) | body `{ reason }` → 200 `{ strike, ban }`; 400 `"Alasan pencabutan wajib diisi."`; 404 `"Strike tidak ditemukan."` (unknown or already removed) |
| GET | /admin/strikes?customer_id=:id | **no** (T-059.1a) | `{ strikes: [...], active_count, banned, limit, offset }` — the history the admin needs before a second strike |
| GET | /admin/reports | yes after US-058 T-058.3 | rows gain `active_strikes: number`, `banned: boolean` (T-059.1a) |
| GET | /admin/claims?status=approved | yes | rows gain `active_strikes: number`, `banned: boolean` for the seller's customer (T-059.1a) |
| POST | /store/auctions/:id/join | yes | gains 403 `banned_customer` `"Akun Anda diblokir karena memiliki 2 strike aktif."` (T-059.1b) |
| POST | /store/bids | yes | gains the same 403 `banned_customer` (T-059.1b) |
| POST | /vendor/auctions | yes | gains 403 `banned_seller` `"Akun Anda diblokir karena memiliki 2 strike aktif."` (T-059.1b) |

#### Briefs

```text
Story: US-059 (task T-059.1a)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria
- AC1: Admin gives each strike with a reason (winner: didn't pay; farmer: didn't ship a paid lot, or refused an approved claim).
- AC2 (data half): a customer's active strikes are countable and a ban is `>= 2`.
- AC3: Strikes expire after 6 months. Admin can remove a strike with a reason.
- AC4: Every ban needs a written reason (D-041).

## Decisions in force
D-058: strikes move no money and write no ledger row.
D-041/D-015: a written reason is mandatory and the admin is recorded.
D-042/D-045: no NIK/bank/phone in a strike row; names are fine.
D-003: one identity is a customer and a member; a strike names the customer.
D-037: an "unpaid win" is the US-058 report row, counted all time.
D-055: Indonesian messages; the apps key on code/status.
D-054/D-060: untouched — a banned farmer is NOT seller-suspended.

## Build
- Model src/modules/moderation/models/strike.ts:
  `Strike { id: model.id({ prefix: "strk" }).primaryKey(), customer_id: text,
   seller_id: text().nullable(), lot_id: text().nullable(),
   reason_type: model.enum(["winner_unpaid","farmer_not_shipped","farmer_claim_refused"]),
   reason: text, created_by: text,
   removed_at: model.dateTime().nullable(), removed_by: text().nullable(),
   removed_reason: text().nullable() }`.
  Indexes `{ on: ["customer_id", "created_at"] }`, `{ on: ["lot_id"] }`.
  Register in modules/moderation/service.ts (`MedusaService({ Claim, LotReport,
  Strike })`, plus any model another story already added); migration
  `bunx medusa db:generate moderation`.
- Helper src/utils/strike.ts (+ __tests__/strike.unit.spec.ts):
  `STRIKE_WINDOW_DAYS = 180`; `isActiveStrike(row, now)` = `removed_at === null &&
  created_at > now - 180 days`; `isBanned(activeCount)` = `activeCount >= 2`.
  Unit cases: exactly 180 days old = expired; removed = inactive; 2 = banned,
  1 = not.
- Read step `getActiveStrikeCountStep({ customer_id })`: `query.graph` `strike`
  fields `id, removed_at, created_at`, filter `{ customer_id }`, count with the
  helper. Read-only, no compensation.
- Workflows src/workflows/give-strike.ts and remove-strike.ts, each locked on
  `strike-user:<customer_id>`:
  - give: resolve the subject — `customer_id` as given, else `seller_id` → member
    email → customer (reuse `applicantsByEmail`, api/admin/farms/route.ts:132-160),
    else the lot's `winner_customer_id`; missing → 404. Insert the row
    (`created_by` = `req.auth_context.actor_id`). Compensation deletes it.
  - remove: load the row; missing or `removed_at` already set → NOT_FOUND "Strike
    tidak ditemukan."; update `removed_at: now, removed_by, removed_reason`.
    Compensation restores the previous three columns.
- Routes:
  - POST src/api/admin/strikes/route.ts (admin only by Medusa's /admin default):
    201 `{ strike, ban: { active_count, banned } }`, recomputed after the write.
  - POST src/api/admin/strikes/[id]/remove/route.ts: 200, same envelope.
  - GET src/api/admin/strikes/route.ts: `customer_id` required,
    `limit`/`offset`; `{ strikes, active_count, banned, limit, offset }`.
  Every row returns `customer_id`, `seller_id`, `lot_id`, `reason_type`,
  `reason`, `created_at`, `removed_*`; never phone, NIK or bank.
- Extend the US-058 report row and the admin claim row with `active_strikes` and
  `banned`, read in ONE batched `query.graph` over the page's customer ids (the
  report's `winner_customer_id`; the claim's seller via the saved `seller_id` and
  the member email). No N+1 read.
- validators.ts per route (zod, `.strict()`): `reason` trimmed min 1 max 500,
  `reason_type` enum, optional ids as strings. Middlewares: POST bodies by
  `validateAndTransformBody`, GET query by `validateAndTransformQuery`.
- `bun run codegen`.

## Start from
- packages/api/src/workflows/steps/claim.ts:240-300 (decision step + compensation)
- packages/api/src/api/admin/farms/route.ts:132-160 (`applicantsByEmail`)
- packages/api/src/utils/pay-window.ts (small constant + unit spec pattern)

## Do not touch
- apps/**; join, bid and create-auction workflows (T-059.1b); the claim and
  report models; seller status/suspend logic (D-054/D-060); US-060/061

## Spec (packages/api/integration-tests/http/admin-strikes.spec.ts)
- a `winner_unpaid` strike on a US-058 report's winner → 201, row saved with the
  admin id; `ban.active_count` 1, `banned` false
- a second strike → `active_count` 2, `banned` true
- remove the second with a reason → `active_count` 1, `banned` false; the row
  still exists with `removed_at`, `removed_by`, `removed_reason`
- remove the same strike twice → 404 "Strike tidak ditemukan."
- blank reason on give and on remove → 400; unknown `reason_type` → 400
- unknown `customer_id`, `seller_id` and `lot_id` → 404; a seller with no
  customer on its identity → 404, no partial row
- a strike 181 days old (insert via the module, then psql) is not counted:
  `active_count` 0, `banned` false
- forced failure after the insert → no row (compensation); after the remove → the
  three removal columns are null again
- report and claim rows carry `active_strikes`/`banned` for the whole page (say
  how you checked it is one query: code read or a query counter)
- no ledger row and both wallet balances unchanged (D-058)

## Cross-cutting checklist
- [ ] D-041: no strike and no removal without a written reason, recorded with the admin
- [ ] D-055: Indonesian messages; the apps key on code/status
- [ ] No money, no ledger row, no payout (D-058); no seller suspend
- [ ] One mutation per step with compensation; expiry is computed, never a stored flag
- [ ] PII: no NIK/bank/phone in any strike payload (D-042/D-045)
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run test:unit → strike unit spec pass
cd packages/api && bun run codegen → run; list the generated strike routes
cd packages/api && bun run test:integration:http -- admin-strikes → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (three routes, bodies, 201/200 shapes,
every error) + migration name + the expiry rule.
```

```text
Story: US-059 (task T-059.1b)   Release: mvp
Agent: backend   Expected: <=35 min
Starts after: T-059.1a (strike model and helper).

## Acceptance criteria
- AC2: A banned winner can't join or bid. A banned farmer can't create auctions.

## Decisions in force
D-047: this is where the deferred ban checks land; US-041 AC4 and US-042 AC1
ban clauses are verified here.
D-054/D-060: paid, shipped, delivered and claim decisions are untouched.
D-055: Indonesian message, codes `banned_customer` / `banned_seller`.
D-058: no money changes in any of the three paths.

## Build
- One read step src/workflows/steps/ban.ts `assertNotBannedStep({ customer_id,
  code })`: count the customer's `strike` rows with `isActiveStrike`; on `>= 2`
  throw FORBIDDEN "Akun Anda diblokir karena memiliki 2 strike aktif." with the
  given code. Read-only, no compensation.
- Join: src/workflows/join-auction.ts — run the step first, inside the existing
  `auction-join:` lock, before `getJoinableAuctionStep`. Delete the `ponytail:`
  at steps/join-fee.ts:20 and name the step there.
- Bid: src/workflows/place-bid.ts — same, first step inside the `lot:<id>` lock;
  delete the `ponytail:` at steps/bid.ts:42.
- Create auction: src/api/vendor/auctions/route.ts POST reads
  `req.auth_context.app_metadata?.customer_id` (the submit route already does,
  :18-22) and passes `customer_id` into `createAuctionWorkflow`, which runs
  `assertNotBannedStep({ customer_id, code: "banned_seller" })` before
  `validateSellerOpenStep`. No `customer_id` on the token → skip the ban step
  (submit refuses the incomplete profile later, unchanged). Add
  `customer_id?: string` to `CreateAuctionWorkflowInput` and thread it.
- Do NOT add the check to: add-draft-lots, update-draft-auction, paid, shipped,
  delivered, claims, live-link. AC2 lists three actions only.

## Start from
- packages/api/src/workflows/join-auction.ts:19-45
- packages/api/src/workflows/place-bid.ts:24-45
- packages/api/src/api/vendor/auctions/route.ts:180-205 (POST)
- packages/api/src/workflows/steps/validate-seller-open.ts (a read guard that throws)

## Do not touch
- apps/**; the strike routes (T-059.1a); seller suspend/terminate logic; US-060/061

## Spec (append to packages/api/integration-tests/http/admin-strikes.spec.ts)
- 2 active strikes → join → 403 `banned_customer`, no participant, no `join_fee`
  row; a bid → 403 `banned_customer`, no bid row, `current_price` unchanged
- 1 active strike → join and bid both succeed
- 2 strikes, one removed → both succeed (ban lifted)
- 2 strikes, one 181 days old → both succeed (expired)
- farmer with 2 active strikes → POST /vendor/auctions → 403 `banned_seller`, no
  auction and no product created; the same farmer with 1 strike → 201
- a banned winner can still mark a won lot delivered and open a claim; a banned
  farmer can still mark a sold lot paid and shipped — proves the check is only
  where AC2 says
- a suspended (not banned) farmer's create is still 403 from
  `validateSellerOpenStep` — unchanged

## Cross-cutting checklist
- [ ] One step reused three times; no route duplicates the check
- [ ] D-055: Indonesian message and code on the error
- [ ] A refused join writes no participant and no ledger row; no other money moves
- [ ] D-054/D-060 exceptions untouched
- [ ] No new `any`; both Koi apps' tsc clean (no route type change here)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run test:integration:http -- admin-strikes → pass (alone)
cd packages/api && bun run test:integration:http -- join-auction → pass (alone)
cd packages/api && bun run test:integration:http -- place-bid → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the three refusal points + the unchanged paths verified.
```

```text
Story: US-059 (task T-059.2)   Release: mvp
Agent: frontend (admin-koi)   Expected: <=45 min
Starts after: T-059.1a and its codegen.

## Acceptance criteria
- AC1: the admin gives a strike, with a reason, from the row that evidences it.
- AC4: no strike and no removal without a written reason; the screen refuses a blank one.

## Decisions in force
D-002: admin-koi only. D-041/D-015: written reason mandatory, confirmation before
the action. D-055: a 409/404 body is rewritten, so the app writes its own copy and
keys on status/code. D-042: masked PII only — names and reasons, never NIK, bank
or phone. D-058: no money text.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /admin/reports | yes after US-058 | rows gain `active_strikes`, `banned` (T-059.1a) |
| GET | /admin/claims?status=approved | yes | rows gain `active_strikes`, `banned` (T-059.1a) |
| GET | /admin/strikes?customer_id= | no → T-059.1a, first | `{ strikes, active_count, banned }` |
| POST | /admin/strikes | no → T-059.1a | `{ customer_id?, seller_id?, lot_id?, reason_type, reason }` → 201 `{ strike, ban }` |
| POST | /admin/strikes/:id/remove | no → T-059.1a | `{ reason }` → 200 `{ strike, ban }` |

## Build (one surface: a strike panel reused on two rows)
- src/lib/data/strikes.ts: `listStrikes(customerId)`, `giveStrike(input)`,
  `removeStrike(id, reason)` — each calls `requireAdmin()` first (admin-koi
  CLAUDE.md security rule), then `sdk.admin.strikes.*` with the existing header
  helper.
- src/lib/helpers/strike-format.ts (+ test): `reasonTypeLabel` (winner_unpaid →
  "Pemenang tidak membayar"; farmer_not_shipped → "Petani tidak mengirim";
  farmer_claim_refused → "Klaim disetujui tidak dipenuhi"), `banLabel(banned)`
  ("Diblokir" / "Tidak diblokir"), `strikeFailureInfo({ status, message })` for the
  app's own copy on 400/404.
- src/components/StrikePanel.tsx (client): "Beri strike" opens a confirm dialog
  with the reason type (select, defaulted per row: report row → `winner_unpaid`,
  approved-claim row → `farmer_claim_refused`) and a required textarea. Confirm
  copy: "Strike ini tidak bisa dihapus, hanya dicabut dengan alasan. Dua strike
  aktif memblokir akun." On success toast "Strike diberikan." +
  `router.refresh()`. Below: the user's strike list (reason type, reason, date,
  "Dicabut") and "Cabut strike" with its own required reason, offered only on an
  active row.
- `/laporan` (US-058's page component): each row gets the panel with the winner's
  `customer_id` and `lot_id`. `/klaim` approved tab: the same with the seller's
  customer and `lot_id`. Both show `Diblokir` / the active count.
- No new page; no `/pengguna` (US-070 owns it).

## Start from
- apps/admin-koi/src/components/ClaimQueue.tsx (tab row + required-reason dialog)
- apps/admin-koi/src/components/FarmQueue.tsx:470-530 (confirmed destructive action, zod reason)
- apps/admin-koi/src/lib/data/farms.ts (server action + requireAdmin shape)

## Do not touch
- packages/api; apps/storefront-koi; the US-058 and US-056 row shapes beyond
  reading the two new fields; the `/pengguna` nav item (stays `ready: false`)

## Cross-cutting checklist
- [ ] Every server action calls `requireAdmin()` itself
- [ ] Punishing action: confirmation + written reason; blank refused on the client too
- [ ] D-055: 400/404 copy is the app's own; never key on message text
- [ ] No money text, no ledger read (D-058); no PII beyond names and reasons
- [ ] Render check on both routes, one strike and one removal
- [ ] `bun run check` clean

## Definition of done
cd apps/admin-koi && bun run check → pass
render check (/laporan with one report, strike → "2 strike aktif" → "Diblokir";
/klaim approved tab, strike → ban; remove with a reason → "Tidak diblokir";
seed via psql as needed) → no hydration/runtime errors, no "undefined"/"NaN";
screenshot path reported.
Also: signed out, both actions refuse (redirect to /masuk).
Report: standard header + render check result + screenshot path.
```

```text
Story: US-059 (task T-059.3)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC4, including the ban clauses carried by US-041 AC4 and US-042 AC1
(D-047). Decisions: D-041, D-047, D-054, D-058, D-055, D-042.
Code under test: modules/moderation/models/strike.ts, workflows/give-strike.ts,
remove-strike.ts, steps/ban.ts, api/admin/strikes/**, join-auction.ts,
place-bid.ts, vendor/auctions/route.ts, StrikePanel.tsx.
Commands (alone, one at a time): bun run test:integration:http -- admin-strikes;
-- join-auction; -- place-bid. Then bun run test:unit. Then bun run check in
admin-koi and storefront-koi.
Browser (render-check): /laporan and /klaim as admin@koi.dev; /akun and /lelang as
a seeded customer with 2 strikes (psql) to see the refused join and bid.
Watch for: a ban at 1 strike; a 181-day strike still counted; a removed strike
still counted; a second row where there should be one; a missing reason accepted;
a strike or removal with no admin recorded; the ban leaking into paid, shipped,
delivered or claim paths; any ledger row or balance change; the seller suspended
by a customer ban (must not be); phone/NIK/bank in a payload or the admin page
source.
Do not change app code. Report PASS/FAIL per AC with file:line and command
output; bugs with repro and expected/actual.
```

**Coverage:** AC1 → T-059.1a, T-059.2; AC2 → T-059.1a (derived ban) and
T-059.1b (three blocked actions), verified T-059.3; AC3 → T-059.1a, T-059.2,
T-059.3; AC4 → T-059.1a (validators), T-059.2 (client), T-059.3. Plan "Strikes
(winners and farmers)" and "Fair play"'s ban-by-hand line are covered; the
shill-bidding table is US-071.

### US-060 Farmer cancels an auction · `todo`
As a **farmer**, I want to cancel my auction before it starts so that I can
withdraw it, with joiners refunded. *(Plan: Cancellations, Refunds in the MVP; D-022, D-031)*
- AC1: Every customer who joined gets a `refund` (+) of their join fee.
- AC2: The farmer's listing fee isn't refunded.
- AC3: The farmer can cancel only while the auction is `draft`, `pending_approval` or `scheduled`. Once it is `live`, the farmer's cancel is refused; only an admin can cancel it (D-022, D-031, US-091).
- [ ] T-060.1 [backend] Cancel workflow: refuse unless `draft`, `pending_approval` or `scheduled`, refund each participant, set status `cancelled`
- [ ] T-060.2 [storefront] Cancel action in the Farmer area, hidden once the auction is `live`
- [ ] T-060.3 [qa] Refunds total exactly the join fees collected; no `listing_fee` refund is written; a farmer cancel on a `live` auction is refused on the server

**Readiness 2026-11-18: ready (`todo`). Nothing blocks it. The D-058 question is
resolved below; no new question is needed.**

**D-058 vs the refund — resolved explicitly.** D-058's "the ledger is untouched"
is about the **sale**: the winner pays the farmer directly, so the platform never
debits or credits a wallet for a lot's price, and pays out nothing. A join fee is
**not** sale money: it is prepaid platform credit (plan "Store credit wallet",
"Credit can only pay platform fees"). Refunding it on a cancel is the plan's own
rule for the MVP (plan "Refunds in the MVP": "only when a farmer or an admin
cancels an auction, … a `refund` of their join fee"; D-022, D-034). So this
story **does** write `refund` rows to `wallet_transaction`, using the `refund`
type already in the enum (`models/wallet-transaction.ts:5-11`). Nothing here
touches a lot's price, a payout balance or farmer payment.

**Every rule pinned:**

| Question | Answer | Source |
|---|---|---|
| Which statuses a farmer may cancel | `draft`, `pending_approval`, `scheduled`. `live`, `closed`, `cancelled` → 409 `auction_not_cancellable` "Lelang ini sudah berjalan, jadi tidak bisa dibatalkan sendiri. Hubungi admin." | AC3, D-022, D-031 |
| What the refund is | one `refund` (+) row per participant, equal to the `join_fee` (−) that customer's wallet actually recorded for this auction (`reference = auction_id`). Never `auction.join_fee`, never a recomputation | AC1; D-034; `steps/join-fee.ts:151-180` |
| Rp0 join (admin override) | no `join_fee` row was written, so no `refund` row is written for it — "refunds total exactly what was collected" | `chargeJoinFeeStep`'s `amount <= 0` branch |
| Listing fee | never refunded. `draft`/`pending_approval`: nothing was charged (D-020). `scheduled`: the charge stands | AC2, D-020 |
| Participants | rows are kept (audit); the auction is not joinable afterwards because only `scheduled`/`live` are (D-048) | AC1; D-048 |
| Bids | none can exist before `live` (bidding needs a `live` auction, `steps/bid.ts:111-117`), so a farmer cancel never touches a bid | verified code |
| Lots | **untouched, stay `open`.** D-035 lets only an admin write lot `cancelled`, and D-046 makes a cancelled auction never public, so no lot status is needed. The close job already skips them (its guard refuses a lot of a cancelled auction, `steps/lot.ts:56-57`) | D-035, D-046; verified code |
| Second cancel | 409 (the first set `cancelled`), so no second refund batch | AC1; lock |
| Suspended farm | 403 `validateSellerOpenStep` — D-054's exception covers only paid/shipped (and D-060 claims), not cancelling | D-054, D-060 |
| Retry / idempotence | the workflow locks `auction:<id>` and re-checks the status inside the lock: a retry after success is a 409, before any write it starts clean | CLAUDE.md §8 |

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| POST | /vendor/auctions/:id/cancel | **no** (T-060.1) | no body → 200 `{ auction: VendorAuction, refund: { participants: number, total: number } }` (`status: "cancelled"`, `total` = whole rupiah refunded); 400 non-empty body `"Pembatalan tidak memakai body."`; 403 `"Kebun Anda belum disetujui, jadi area petani belum terbuka."`; 404 `"Lelang tidak ditemukan."` (unknown or another farm's); 409 `auction_not_cancellable` |
| GET | /vendor/auctions and /vendor/auctions/:id | yes | unchanged shape; a cancelled auction reads `status: "cancelled"` |
| GET | /store/wallet | yes | shows the `refund` rows like any other entry (no shape change) |

#### Briefs

```text
Story: US-060 (task T-060.1)   Release: mvp
Agent: backend   Expected: <=45 min

## Acceptance criteria
- AC1: Every customer who joined gets a `refund` (+) of their join fee.
- AC2: The farmer's listing fee isn't refunded.
- AC3: The farmer can cancel only while the auction is `draft`, `pending_approval` or `scheduled`. Once it is `live`, the farmer's cancel is refused.

## Decisions in force
D-022/D-031: the three cancellable statuses; once live, only an admin.
D-034: a cancel refunds every join fee and nothing else.
D-020: the listing fee is charged only at approval; never refunded.
D-058: no sale money moves; a join fee is platform credit, so its refund IS a
ledger row of type `refund` (resolved in the story's readiness note).
D-054/D-060: not extended — cancelling keeps `validateSellerOpenStep`.
D-035: a farmer never writes lot `cancelled`; lots stay `open`.
D-055: Indonesian messages; the app keys on code/status.
CLAUDE.md §8: the ledger is append-only. One batched refund write, no
compensation; the status step compensates.

## Build
- Read guard `getCancellableAuctionStep({ auction_id, seller_id })`, under the
  `auction:<id>` lock: `query.graph` auction `id, seller_id, status,
  join_fee, fee_override_join_fee`. Missing or another seller → NOT_FOUND
  "Lelang tidak ditemukan." (no existence leak). Status not in
  `["draft","pending_approval","scheduled"]` → CONFLICT "Lelang ini sudah
  berjalan, jadi tidak bisa dibatalkan sendiri. Hubungi admin." code
  `auction_not_cancellable`. Returns `{ id, previous_status }`.
- Refund read step `getJoinFeeRefundsStep({ auction_id })`: `query.graph`
  `auction_participant` fields `id, customer_id, auction_id`; then ONE
  `query.graph` over `wallet_transaction` with fields `id, wallet_id, amount,
  created_by, reference, type` and filters `{ reference: auction_id,
  type: "join_fee" }`. Pair each participant with their own `join_fee` row via
  `created_by === participant.customer_id` (the charge step writes
  `created_by: customer_id`, steps/join-fee.ts:170-178). Build
  `[{ wallet_id, amount: <absolute join_fee amount>, reference: auction_id,
  created_by: "refund" }]`. A participant with no ledger row (Rp0 fee) gets no
  refund. Return the rows plus the total.
- Workflow src/workflows/cancel-auction.ts `{ seller_id, auction_id }`:
  1. lock `auction:<id>` (same key as approve/reject/start/close)
  2. `validateSellerOpenStep` (403 for a suspended farm)
  3. `getCancellableAuctionStep`
  4. `getJoinFeeRefundsStep`
  5. `setAuctionFieldsStep({ id, update: { status: "cancelled" } })` — existing
     step, compensates back to the previous status
  6. `refundJoinFeesStep`: ONE `createWalletTransactions(rows)` call (all rows or
     none at the DB). Last mutation, no compensation — the ledger is
     append-only; nothing that can abort runs after it. If the call throws,
     step 5 compensates and no row exists.
  7. release the lock; return `{ auction, refund: { participants: rows.length,
     total } }`.
- Route packages/api/src/api/vendor/auctions/[id]/cancel/route.ts (thin): reject a non-empty
  body with 400 "Pembatalan tidak memakai body."; identity from
  `req.seller_context!.seller_id`; 200 with the read-back `VendorAuction`
  (`getVendorAuctionDetail`'s mapper, without lots) and the refund envelope.
  Import `…/types/seller-context` (the tsc requirement).
- Mercur's /vendor catch-all authenticates the member; add a middlewares entry
  only if you use a body validator (a body check in the route is enough). Do not
  put a method-less matcher on `/vendor/auctions/:id/cancel`.
- `bun run codegen`.

## Start from
- packages/api/src/workflows/decide-auction.ts:25-100 (lock, guard, status step,
  charge as last mutation)
- packages/api/src/workflows/steps/join-fee.ts:128-160 (the charge shape and
  `created_by` convention a refund must mirror)
- packages/api/src/workflows/steps/auction.ts:424-451 (setAuctionFieldsStep's
  compensation)

## Do not touch
- apps/**; lot status/rows; the listing-fee charge; US-091's admin cancel; US-061

## Spec (packages/api/integration-tests/http/farmer-cancel-auction.spec.ts)
Seed an auction with 2 participants (each with a real `join_fee` charge via the
join workflow) and a listing fee charged (approve path).
- cancel a `scheduled` auction with 2 participants → 200, status `cancelled`,
  `refund.participants` 2; two `refund` (+) rows, each equal to that customer's
  `join_fee`; wallet balances rise by exactly those amounts; NO `listing_fee`
  refund row
- cancel a `draft` with no participants → 200, 0 refunds, no ledger row
- cancel a `pending_approval` → 200, `cancelled`
- a participant with an Rp0 join (admin override 0) → no refund row for them
- second cancel → 409 `auction_not_cancellable`, no second refund batch
- `live`, `closed`, `cancelled` → 409; another farm's auction → 404; unknown id → 404
- a suspended farm → 403; the auction stays `scheduled`
- non-empty body → 400, nothing written
- forced failure inside `refundJoinFeesStep` (test wrapper) → status back to
  `scheduled`, zero refund rows (append-only respected)
- auction lots still `open`, `winner_customer_id`/`final_price` null; a close-job
  run afterwards changes nothing (a lot of a cancelled auction is skipped)
- no `listing_fee` row with the auction id after cancel

## Cross-cutting checklist
- [ ] Money: whole-rupiah integers; the refund mirrors the charge exactly
- [ ] Ledger append-only: no update, no delete, one batched insert, no compensation
- [ ] Every mutation in a workflow; the route is thin; identity from `req.seller_context`
- [ ] D-055: Indonesian messages; codes on errors
- [ ] D-054: cancelling is NOT an exception — suspended → 403
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run; list the generated cancel route
cd packages/api && bun run test:integration:http -- farmer-cancel-auction → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + API contract (route, body rule, 200 shape, every error)
+ the refund rule as built + the lot-status decision as built.
```

```text
Story: US-060 (task T-060.2)   Release: mvp
Agent: frontend (storefront-koi)   Expected: <=40 min
Starts after: T-060.1 and its codegen.

## Acceptance criteria
- AC3 (screen half): the cancel action is offered only while the auction is
  `draft`, `pending_approval` or `scheduled`, and never once it is `live`.

## Decisions in force
D-055: a 409 body is rewritten; the app writes its own copy and keys on status/code.
D-022/D-031: the three cancellable statuses. D-058's sale scope: the copy says
join fees return to the wallet and the listing fee does not.
A destructive action is confirmed first.

## Endpoint inventory
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| GET | /vendor/auctions/:id | yes | `auction.status` drives visibility |
| POST | /vendor/auctions/:id/cancel | no → T-060.1, first | no body → 200 `{ auction, refund: { participants, total } }`; 403; 404; 409 `auction_not_cancellable` |

## Build (one surface: the farmer's auction detail page)
- src/lib/helpers/auction-cancel.ts (+ .test.ts): `canCancelAuction(status)` →
  true for `draft`, `pending_approval`, `scheduled`. `cancelFailureInfo({ status,
  code, message })` → 409 `auction_not_cancellable` uses the server message and
  sets refresh; 403/404 keep the server message; else the server's message.
- src/lib/data/auctions.ts: `cancelAuction(id)` beside `submitAuction`, same
  `{ success, error, refund }` result shape, `revalidatePath(farmAuctionHref(id))`
  and `revalidatePath(ROUTES.farmHome)`.
- components/AccountPage/components/CancelAuctionButton.tsx (client): an outline
  destructive button "Batalkan lelang" + confirm dialog. Confirmation copy names
  both money facts from AC1/AC2: "Biaya ikut lelang setiap peserta dikembalikan
  ke saldo mereka. Biaya pasang lelang tidak dikembalikan." On success toast
  "Lelang dibatalkan. {n} biaya ikut lelang dikembalikan." and
  `router.refresh()`; after that the page reads `cancelled` and the button is gone.
- EditAuction.tsx: render the button in the page head area when
  `canCancelAuction(auction.status)`; never on `live`/`closed`/`cancelled`.
  `auctionStatusLabel` already handles `cancelled`; no new label.

## Start from
- apps/storefront-koi/src/components/sections/AccountPage/components/SubmitAuctionButton.tsx
- apps/storefront-koi/src/components/sections/AccountPage/components/EditAuction.tsx:240-260 (head) and :415-425 (the read-only notice)
- apps/storefront-koi/src/lib/helpers/sold-lot-actions.test.ts (test style)

## Do not touch
- packages/api; apps/admin-koi; the submit flow; US-091's admin cancel

## Cross-cutting checklist
- [ ] Confirm before the destructive action; the copy states both money facts (AC1, AC2)
- [ ] D-055: 409 copy is the app's own; never key on message text
- [ ] No raw `fetch`; no client-side money maths (the server returns the total)
- [ ] UI task: render check on a draft auction (button), a live one (no button),
      and a cancel that succeeds
- [ ] `bun run check` clean

## Definition of done
cd apps/storefront-koi && bun run check → pass
render check (/akun/kebun/lelang/<draft> shows "Batalkan lelang"; after cancelling
the status reads "Dibatalkan" and the button is gone; /akun/kebun/lelang/<live>
shows no button; the wallet shows the refunds) → clean; screenshot path reported.
Report: standard header + render check result + screenshot path.
```

```text
Story: US-060 (task T-060.3)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1–AC3. Decisions: D-020, D-022, D-031, D-034, D-035, D-048, D-054,
D-058 (its sale scope, not the join-fee refund), D-055.
Code under test: workflows/cancel-auction.ts, steps/auction-cancel.ts,
api/vendor/auctions/[id]/cancel/route.ts, CancelAuctionButton.tsx.
Commands (alone): bun run test:integration:http -- farmer-cancel-auction. Then
bun run check in storefront-koi.
Browser (render-check): /akun/kebun/lelang/<draft>, <scheduled with joiners>,
<live>; /akun/saldo after a cancel.
Watch for: a refund row larger or smaller than the charge; a `listing_fee`
refund anywhere; a refund for a Rp0 join; a second refund batch after a retry; a
cancel accepted on `live`/`closed`/`cancelled`; a farmer cancelling another
farm's auction (must be 404, not 403); lot statuses changed; bids touched; a
suspended farm allowed to cancel; a balance not equal to the ledger sum.
Do not change app code. Report PASS/FAIL per AC with file:line and command
output; bugs with repro and expected/actual.
```

**Coverage:** AC1 → T-060.1, T-060.2 (confirmation copy), T-060.3; AC2 →
T-060.1, T-060.2, T-060.3; AC3 → T-060.1 (server), T-060.2 (screen), T-060.3.
Plan "Cancellations (MVP)" farmer-cancel bullet and "Refunds in the MVP" are
covered; the admin cancel (live auction, D-034) stays US-091.

### US-061 Claim videos are cleaned up · `todo`
As the **platform**, I want claim videos deleted 30 days after a claim closes so
that storage stays bounded. *(Plan: Dead-on-arrival claims 7; D-027)*
- AC1: A claim is closed when its status is `confirmed` or `rejected` (D-027). Its video is deleted 30 days after it closed; the claim record stays.
- [ ] T-061.1 [backend] The scheduled job deletes the files and keeps the claim record
- [ ] T-061.1b [backend] `video_deleted_at` on the claim row and `has_video` derived from it on the three claim rows
- [ ] T-061.2 [qa] Only `confirmed` or `rejected` claims closed more than 30 days ago are affected

**Readiness 2026-11-18: ready (`todo`). Nothing blocks it. One ordering
dependency, no question.**
- **Ordering:** the "closed at" timestamp for `confirmed` is `confirmed_at`,
  added by **US-056 T-056.1a**. Start US-061 after that task lands; do not add a
  second column for the same fact. `rejected` already has `decided_at`
  (`steps/claim.ts:257-299`).
- **Verified:** `src/jobs/` holds only `close-lots.ts` and `start-auctions.ts`
  — there is no cleanup job yet, so T-061.1 creates one. Nothing folds into
  `close-lots.ts` (its filter and log are about lot `end_time`).
- **Verified:** the File Module can delete by key —
  `fileModule.deleteFiles(id: string)` (`@medusajs/file` 2.21.2,
  `file-module-service.d.ts:16-17`), and the local provider's `delete` ignores
  `ENOENT` (`file-local/dist/services/local-file.js:115-130`), which is what
  makes a re-run harmless.
- **Verified:** `has_video` today is the constant `true` in three places
  (`api/store/won-lots/route.ts:245`, `api/vendor/claims/route.ts:119`,
  derived for the winner row through `readWonLotExtras`). After a delete it must
  become `false`, so the row needs one marker: `video_deleted_at`.
- The claim row itself is never deleted (AC1) and `video_file_key` stays where it
  is (a not-null column); no route ever returns it (D-018), and the two private
  video routes already 404 when the provider no longer has the file
  (`api/utils/private-image.ts:26-32`).
- No money: a delete writes no ledger row and touches no wallet (D-058).

**Rules pinned:**

| Question | Answer |
|---|---|
| Which job | a new `src/jobs/delete-claim-videos.ts`, `schedule: "0 3 * * *"` (daily 03:00), own log line. Not `close-lots.ts` |
| What marks a video deletable | claim `status` in `["confirmed","rejected"]` **and** its closed timestamp older than 30 days. Closed timestamp = `confirmed_at` for `confirmed`, `decided_at` for `rejected` (D-027, D-038) |
| Retention window | exactly **30 days** after closed; the row must be strictly older (`closed_at < now - 30 days`) |
| Idempotence | `video_deleted_at` is set only after the delete returns; the provider ignores `ENOENT`, so a crash between delete and update, or a re-run, cannot fail and writes no second delete of a live file |
| Batching | ids read page by page (`PAGE = 50`, `id ASC`) before processing, like `close-lots.ts:9-31`; one failure logged, the rest still run |
| What happens to the claim row | stays, every column unchanged, plus `video_deleted_at` (ISO). `has_video` becomes `false` |
| A non-closed claim | never touched: `open`, `approved`, `disputed`, `resolved` keep their video |
| A closed claim inside 30 days | untouched; `has_video` stays `true` |

**Endpoint inventory (story)**

| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
| — | (no new route) | — | — |
| GET | /vendor/claims | yes | `has_video` becomes `false` once the video is gone (T-061.1b) |
| GET | /admin/claims | yes | same change (T-061.1b) |
| GET | /store/won-lots and /store/won-lots/:id | yes | `claim.has_video` becomes `false` (T-061.1b) |
| GET | /vendor/claims/:id/video, /admin/claims/:id/video | yes | already 404 after deletion (provider read fails); no change needed |

#### Briefs

```text
Story: US-061 (task T-061.1b)   Release: mvp
Agent: backend   Expected: <=20 min
Starts after: US-056 T-056.1a (`confirmed_at` exists). Do this before T-061.1.

## Acceptance criteria
- AC1 (read half): the claim record stays, and the API says whether the video is
  still there.

## Decisions in force
D-018/D-040: the file is private; no key or URL in any response, ever.
D-027/D-038: closed = `confirmed` or `rejected`.
D-055: Indonesian messages where a user can see one (these routes show none for
this field). No money (D-058).

## Build
- Migration: add `video_deleted_at: model.dateTime().nullable()` to
  `models/claim.ts`; `bunx medusa db:generate moderation`. No data backfill.
- `has_video` becomes `video_deleted_at === null` in exactly three places:
  `api/store/won-lots/route.ts` (`readWonLotExtras` claim mapping, currently the
  comment "true by construction" at :205-206 and the value at :245),
  `api/vendor/claims/route.ts:119` (`toClaimListRows`), and the admin row inherits
  it (it maps through `toClaimListRows`). Add `video_deleted_at` to each claim
  read's `fields` list.
- Do not select or return `video_file_key` anywhere (unchanged).
- No route, no workflow, no money movement.

## Start from
- packages/api/src/api/store/won-lots/route.ts:190-260
- packages/api/src/api/vendor/claims/route.ts:100-125

## Do not touch
- apps/**; the claim status columns; the video routes; US-056's workflows

## Spec (append to packages/api/integration-tests/http/claims-read.spec.ts)
- a claim with `video_deleted_at` null → `has_video: true` on the winner row, the
  farmer row and the admin row
- set `video_deleted_at` (module update) → all three read `false`
- no response contains `video_file_key` or a URL in either case

## Cross-cutting checklist
- [ ] D-018: never a key or URL
- [ ] `bun run codegen`; `bun run tsc` clean in BOTH Koi apps
- [ ] No money, no ledger (D-058)

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run codegen → run
cd packages/api && bun run test:integration:http -- claims-read → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the three read changes + migration name.
```

```text
Story: US-061 (task T-061.1)   Release: mvp
Agent: backend   Expected: <=40 min
Starts after: T-061.1b.

## Acceptance criteria
- AC1: A claim is closed when its status is `confirmed` or `rejected` (D-027). Its video is deleted 30 days after it closed; the claim record stays.

## Decisions in force
D-027/D-038: closed statuses and their timestamps (`confirmed_at`, `decided_at`).
D-018/D-040: private file; only the job touches the bytes.
D-053 stands: nothing auto-confirms delivery; this job reads only claims.
No money (D-058). CLAUDE.md §9: a job fetches by id, runs a workflow, is idempotent and batches.

## Build
- Workflow src/workflows/delete-claim-video.ts `{ claim_id }`:
  1. lock `claim:<id>` (same key as the claim decisions)
  2. read step `getDeletableClaimStep`: `query.graph` claim `id, status,
     video_file_key, video_deleted_at, confirmed_at, decided_at`. Missing,
     already `video_deleted_at` set, status not in `["confirmed","rejected"]`, or
     `closedAt >= now - 30 days` → return `{ skip: true, reason }` (a skip, not an
     error). Else `{ skip: false, file_key }`.
  3. `when` skip false → `deleteClaimVideoFileStep`: resolve `Modules.FILE` and
     `deleteFiles(file_key)`; then `markClaimVideoDeletedStep` sets
     `video_deleted_at: new Date()`. Compensation on the mark is the previous
     null; the file delete has no compensation (a deleted private video is not
     recoverable, and the claim is closed so nothing reads it again).
  4. release the lock; return `{ deleted, skipped }`.
- Job src/jobs/delete-claim-videos.ts:
  - `collectIds` copied from `close-lots.ts:9-31` (page 50, `id ASC`), filter:
    `status: { $in: ["confirmed","rejected"] }` and
    `$or: [{ confirmed_at: { $lt: cutoff } }, { decided_at: { $lt: cutoff } }]`
    where `cutoff = new Date(Date.now() - 30*864e5)`. Add
    `video_deleted_at: null` to the filter so deleted rows leave the page.
  - per id: run the workflow in try/catch, count `deleted`/`skipped`/`failed`
    separately; one `logger.error` per failure.
  - one summary line: `delete-claim-videos: found N, deleted D, skipped S, failed F`.
  - `export const config = { name: "delete-claim-videos", schedule: "0 3 * * *" }`.
- Do not touch `close-lots.ts`, `start-auctions.ts` or any claim route.

## Start from
- packages/api/src/jobs/close-lots.ts (paging, per-id try/catch, summary log, config)
- packages/api/src/workflows/reject-claim.ts (lock + read guard + one mutation)
- packages/api/src/api/utils/private-image.ts:26-32 (`Modules.FILE` resolve)

## Do not touch
- apps/**; the claim model beyond T-061.1b's column; claim decision workflows;
  close-lots and start-auctions

## Spec (packages/api/integration-tests/http/claim-video-cleanup.spec.ts)
Seed claims through the module service, with a real private file per claim
(upload through the same step or `fileModule` write used by open-claim):
- `confirmed` with `confirmed_at` 31 days ago → file gone from the provider
  (`getAsBuffer` throws), `video_deleted_at` set, row still present with every
  other column unchanged, `has_video` false on all three routes
- `rejected` with `decided_at` 31 days ago → same
- `confirmed` 29 days ago → untouched, file still readable, `video_deleted_at` null
- `open`, `approved`, `disputed`, `resolved` with old timestamps → all untouched
  (no `confirmed_at`/`decided_at` is used for them)
- closed 31 days ago but `video_deleted_at` already set → skipped, no error
- file already missing on disk (delete out of band) → job still sets
  `video_deleted_at`, no thrown error (ENOENT ignored), summary says deleted
- run the job twice → second run deletes nothing, summary `deleted 0`
- one row forced to fail (test wrapper) → other rows still processed, job exits
  normally, `failed 1` in the log
- no ledger row, no wallet change (D-058)

## Cross-cutting checklist
- [ ] Idempotent by `video_deleted_at` + provider ENOENT handling; proven by the
      two-run case
- [ ] Batched: paged ids read first, then per-id workflow; no N+1 query per row
- [ ] Job is a plain handler; every mutation inside a workflow; lock per claim
- [ ] No key or URL ever returned; no money (D-058)
- [ ] `bun run tsc` clean; no route change so codegen only if T-061.1b changed types

## Definition of done
cd packages/api && bun x tsc --noEmit -p . → clean
cd packages/api && bun run test:integration:http -- claim-video-cleanup → pass (alone)
cd apps/storefront-koi && bun run tsc; cd apps/admin-koi && bun run tsc → clean
Report: standard header + the two timestamps used + the skip/deleted counts from
one live tick + migration name from T-061.1b.
```

```text
Story: US-061 (task T-061.2)   Release: mvp
Agent: qa   Expected: <=30 min
Starts when: no backend agent and no other Jest run is active.

## Acceptance criteria
Verify AC1. Decisions: D-018, D-027, D-038, D-053, D-058.
Code under test: packages/api/src/jobs/delete-claim-videos.ts,
workflows/delete-claim-video.ts, steps/claim-video.ts,
models/claim.ts (`video_deleted_at`), the three claim read routes.
Commands (alone): bun run test:integration:http -- claim-video-cleanup; then --
claims-read.
Browser (render-check): /akun/kebun/terjual (farmer) and /klaim (admin) for a
claim whose video was deleted: no video control, no "Tidak ada video unboxing."
contradiction — say what the screen shows.
Watch for: a claim deleted inside the 30 days; a non-closed claim touched;
`resolved` treated as closed (it is not); the claim row deleted or a status
changed; `has_video` still true after the file is gone; a video route returning
bytes after deletion; a second run deleting again or throwing; the job failing
the whole batch on one bad row; a file key or URL in any payload; any money.
Do not change app code. Report PASS/FAIL per AC with file:line and command
output; bugs with repro and expected/actual.
```

**Coverage:** AC1 → T-061.1b (the closed/closed-at facts and `has_video`),
T-061.1 (deletion and retention), T-061.2. Plan "Dead-on-arrival claims" item 7
("Videos are deleted 30 days after the claim is closed") is covered.

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

### US-094 Shared tab, separator and scroll-area orientation variants · `done (evidence: packages/ui/src/primitives/tabs.tsx:17,26,60,63; separator.tsx:14; scroll-area.tsx:38; grep -rn 'data-horizontal\|data-vertical' packages/ui/src apps/*/src → 0 matches; /klaim tab list 264×36 horizontal with the panel below, /saldo/topup 272×36, /katalog line underline 2 px on the selected tab, lot-sheet separator 383×1; packages/ui + storefront-koi + admin-koi tsc clean; storefront check 202/202; admin-koi check 36/36)`
Found by qa while verifying US-055: the `/klaim` tab strip rendered as a
vertical column.
- AC1: A `@koi/ui` `Tabs`, `Separator` and `ScrollArea` bar lays out per its
  `orientation` prop in both Koi apps.
- [x] T-094.1 [ui] Replace the attribute-presence variant classes with
  `data-[orientation=…]` / `group-data-[orientation=…]` so they match the DOM.

**Root cause (verified — do not re-introduce):** `@base-ui/react` 1.9.0 emits
only `data-orientation="horizontal"|"vertical"` (plus the Tailwind group variant
on the parent), never the bare `data-horizontal` / `data-vertical` attributes
that Tailwind's attribute-presence variants (`data-horizontal:`, `data-vertical:`,
`group-data-horizontal/…`) target. Those classes never matched, so the tab list
kept `flex-col` and the separator/scrollbar lost their size. Always write
`data-[orientation=horizontal]:` (and `group-data-[orientation=horizontal]/tabs:`)
in `@koi/ui`.

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
| mvp-Q39 | **Answered 2026-11-16 (D-057), in force since 2026-11-17 (D-059):** option (b), one reveal records both fields — the winner's reveal returns the full `account_number` **and** full `holder_name`, with **one** `pii_reveal_audit` row (`field: "bank_account"`, not one per field). D-059 ends the D-044 hold, so the rule is live: US-051 AC3, T-051.1a, T-051.3a (body enum `"bank_account"`, response `{ account_number, holder_name }`), T-051.2a. *(Was: does the reveal include the account-holder name? Options (a) number only; (b) number and holder name.)* | none (was US-051 T-051.3a; unparked 2026-11-17) |
| mvp-Q40 | **Open (2026-11-17, non-blocking).** The masked bidder name is derived at read time from the customer's current `first_name` + id, so a customer who renames themselves re-masks their own past bids on the next read. Options: (a) accept the derived mask — what T-044.1 builds; (b) snapshot the mask onto the `bid` row at placement time (new column + migration, stable forever). Recommend (a). *(Was: does the mask have to stay stable if a customer renames themselves?)* | none (was US-044 T-044.1) |
| mvp-Q41 | **Open (2026-11-17, non-blocking).** Lot-page polling interval for US-045: 2 s (recommended, T-045.1 uses it via `LOT_POLL_MS`) or 3/5 s. No decision or plan line records one; T-045.1 defines it in one place, so a change is one line. *(Was: how many seconds between lot-page polls?)* | none (was US-045 T-045.1) |
| mvp-Q42 | **Open (2026-11-17, non-blocking; option (a) is what T-046.2 ships).** "One lot at a time" in the live room means what? Options: (a) explicit selection only — the room stages the lot of the tightest `live` auction, `?lot=` stages another, and nothing else appears when it closes until reload; (b) (a) plus a "lot berikutnya" control; (c) auto-rotate to the next open lot when the staged one closes. Build choice is (a) until the owner says otherwise; (b)/(c) are frontend-only additions. *(Was: does the live room select or rotate lots?)* | none (T-046.2 builds (a)) |
| mvp-Q43 | **Answered 2026-11-17 (D-061):** a plain nullable `auction.live_stream_url` column (not a Mercur custom field), written by the farmer through `POST /vendor/auctions/:id/live-link` and by an admin through `POST /admin/auctions/:id/live-link`, in any status except `closed`/`cancelled`; rendered as an outbound link, no iframe, no embedded player, no host check beyond the YouTube/Instagram allow-list. admin-koi exposes the write (T-046.5). Unblocks US-046 T-046.1. *(Was: who may set the farmer's live link, in which auction status, and is it stored as a column or a custom field?)* | none (was US-046 T-046.1) |
| mvp-Q44 | **Open (2026-11-17, non-blocking).** Can a winner file a second claim on the same lot? Shipped rule for US-054: one claim per lot whatever its status — unique index on `claim.lot_id` plus a 409; nothing in US-054 reaches `rejected` (US-055 does). Options: (a) keep one-claim-per-lot (recommended); (b) allow a new claim after a rejection (US-055 drops the index, one-line migration). US-054's ACs hold either way. *(Was: is a claim repeatable?)* | none (was US-054 T-054.1) |
| mvp-Q45 | **Answered 2026-11-17 (D-060), option (b):** a farm suspended after approval may also accept or dispute a claim on its own sold lot — the D-054 exception (ownership + not `terminated`), not `validateSellerOpenStep`. `pending_approval`, a rejected registration and `terminated` still 403. Follow-up US-055 T-055.5 (the shipped spec case that asserts 403 for suspended changes to 200). *(Was: may a suspended farm accept or dispute a claim on its own sold lot?)* | none (was US-055 T-055.1a) |
| mvp-Q46 | **Open (2026-11-17, non-blocking).** AC2 requires the admin's written reason; the plan says nothing about the farmer's dispute carrying a note. Shipped: no farmer note (the admin judges from the video and the claim facts). Options: (a) no farmer note (what T-055.2 builds); (b) an optional farmer note, one nullable column shown in the admin row. *(Was: does a dispute carry the farmer's own note?)* | US-055 T-055.2 |
| mvp-Q47 | **Open (2026-11-17, non-blocking).** US-056 AC2 says "missing the 3 days, **or refusing an approved claim**", but D-038's enum has no `refused` state, so a refusal has nowhere to be recorded. Shipped: (a) no new state — a refusal not acted on is the 3-day miss, and T-056.3 flags `approved` older than 3 days. Options: (a) keep it (recommended; no column, so copy can change without a migration); (b) add a refusal state out of `approved` (new decision + enum change + migration; touches US-055's finality). *(Was: how is a farmer's explicit refusal of an approved claim recorded?)* Re-checked 2026-11-18 at US-051/US-052 acceptance: still open, non-blocking, touches neither story. | none (was US-056 T-056.3) |
| mvp-Q48 | **Open (2026-11-18, non-blocking).** US-057 AC1 says a winner may rate "once the lot is `shipped`". Does that mean exactly `shipped`, or `shipped` or later (delivered, claimed)? And the plan says "1-5 stars and a comment" — is the comment required? Shipped: shipped|delivered|claimed, comment optional and <=300 chars. Options: (a) what is built (recommended); (b) exactly `shipped` and a required comment. No migration either way. *(Was: when exactly may a winner rate, and is the comment required?)* | US-057 T-057.1 |
| mvp-Q49 | **Open (2026-11-18, non-blocking).** US-059 AC2 reads "2 active strikes = ban", i.e. automatic. Should a ban instead be an explicit admin action so a second strike never silently blocks an account? Shipped: automatic at the second active strike, using that strike's written reason, ban derived from `active_count` (no ban table). Note: `farmer_not_shipped` has no queue row in the MVP (no shipping deadline exists), so the route accepts it directly. Options: (a) automatic (built, recommended); (b) an explicit ban action (new table/route/UI). *(Was: is a ban automatic at the second strike or an explicit admin action?)* | US-059 T-059.1a |
| — (payment model) | **Answered 2026-11-17 (D-058):** the MVP pays off-platform — the winner pays the farmer directly within 1×24 h, the farmer marks the lot paid (`won → paid`) then ships; the platform holds and pays out no money. Xendit escrow stays the planned beta direction, out of MVP scope. Un-parks US-056, US-058, US-059's payment strike and T-052.4; restores D-044/D-057 through D-059. *(Was: does the MVP pay in-app (Xendit escrow or wallet escrow), or off-platform?)* | none (was US-052 T-052.4, US-056, US-058, US-059) |

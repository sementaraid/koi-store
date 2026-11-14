# Koi Store: User Stories and Tasks

**Source of truth:** `docs/mvp-plan.md`. Every story here traces back to a plan
section. Nothing here adds rules the plan doesn't contain. Gaps are listed under
[Open questions](#open-questions) and need an owner decision before they're built.

**Owner:** the `product-owner` agent maintains this file. Builders (`backend`,
`frontend`) and `qa` refer to story IDs in their reports.

## How to read this

- **Story:** `US-xxx`, written as *As a … I want … so that …*
- **Acceptance criteria (AC):** testable statements. qa verifies each one.
- **Tasks:** `T-xxx.n`, tagged with the owning agent:
  `[backend]` (`packages/api`), `[storefront]` (`apps/storefront-koi`),
  `[admin]` (`apps/admin-koi`), `[ui]` (`packages/ui`), `[qa]`, `[ops]`.
- **Status:** `todo` · `in progress` · `done` (qa PASS, with evidence linked) ·
  `blocked` (waiting on an open question)
- Tick a task `[x]` only when its check has run and passed.

Roles: **Customer** (any registered user) · **Farmer** (a customer whose farm is
approved, same login) · **Admin** (admin team, `apps/admin-koi` only)

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

### US-002 Customer registers and signs in · `in progress`
As a **visitor**, I want to register and sign in so that I can top up, join
auctions and bid. *(Plan: Users and roles)*
- AC1: Registering with name, email, phone and password creates a customer account.
- AC2: Sign in, sign out, forgotten password and setting a new password all work.
- AC3: The phone number is stored on the customer, so WhatsApp can be linked later (US-080). → **Q1**
- [x] T-002.1 [storefront] Pages `daftar`, `masuk`, `lupa-sandi`, `atur-sandi`, `keluar` exist
- [ ] T-002.2 [qa] Verify AC1–AC2 end to end against the backend
- [ ] T-002.3 [storefront] Depends on Q1: confirm the phone format and that it's saved as the WhatsApp number

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

### US-010 Customer sees balance and history · `todo`
As a **customer**, I want to see my balance and every transaction so that I
know what I can spend. *(Plan: Store credit wallet)*
- AC1: Balance equals the sum of my transactions.
- AC2: History lists type, signed amount, reference and date, newest first.
- AC3: Each account has exactly one wallet, created when it's first needed.
- [ ] T-010.1 [backend] Wallet module: `wallet`, `wallet_transaction` (type, integer amount, reference, created_by). Link wallet ↔ customer
- [ ] T-010.2 [backend] Store route `GET /store/wallet` (balance + paginated transactions), identity from `auth_context`
- [ ] T-010.3 [storefront] Balance and history page under `akun`
- [ ] T-010.4 [qa] Balance = sum; no update or delete path exists on transactions

### US-011 Customer requests a top-up · `todo`
As a **customer**, I want to upload my transfer screenshot so that admin can
credit my wallet. *(Plan: How credit moves 1–2)*
- AC1: Any amount is accepted (no minimum), as an integer.
- AC2: Uploading a screenshot creates a `pending` top-up request. The balance doesn't change yet.
- AC3: The page shows the platform's bank account to transfer to. → **Q2**
- AC4: I can see my requests and their status (pending, approved, rejected with reason).
- [ ] T-011.1 [backend] `topup_request` model (amount, screenshot file, status, reviewed_by, reason) + create workflow
- [ ] T-011.2 [backend] Store routes: create request (with file upload), list my requests
- [ ] T-011.3 [storefront] Top-up form and request list
- [ ] T-011.4 [qa] Pending requests never change the balance

### US-012 Admin approves or rejects a top-up · `todo`
As an **admin**, I want to approve a top-up after checking the bank statement so
that credit only exists for real transfers. *(Plan: How credit moves 3)*
- AC1: Approving records one `manual_topup` (+) with the admin and a bank reference.
- AC2: Rejecting needs a reason that the customer can see. No transaction is recorded.
- AC3: A request can be decided only once.
- [ ] T-012.1 [backend] Approve/reject workflow (one mutation per step, compensation) + `/admin` routes
- [ ] T-012.2 [admin] Top-up queue `/saldo/topup`: screenshot, amount, approve/reject with reason
- [ ] T-012.3 [qa] Double approval impossible; audit fields saved

### US-013 Admin adjusts a balance · `todo`
As an **admin**, I want to correct a balance with a written reason so that
mistakes are fixed without editing history. *(Plan: Transaction types, Rules)*
- AC1: An adjustment can be + or −, and needs a reason. The admin is recorded.
- AC2: Existing transactions are never changed.
- [ ] T-013.1 [backend] Adjustment workflow + `/admin` route
- [ ] T-013.2 [admin] `/saldo/koreksi` screen
- [ ] T-013.3 [qa] Reason required; append-only holds

### US-014 Admin edits the fee table · `todo`
As an **admin**, I want to edit each category's listing and join fees so that
pricing can change without code. *(Plan: Fees)*
- AC1: The fee table holds category name, listing fee per lot and join fee per auction (integers).
- AC2: It's seeded with the four approved categories and fees (Lokal no cert 50.000/100.000, Lokal cert 100.000/250.000, Import cert 200.000/500.000, Premium 400.000/1.000.000).
- AC3: A change applies only to auctions created after it, never to approved ones.
- [ ] T-014.1 [backend] `fee_category` model, seed, `/admin` CRUD routes
- [ ] T-014.2 [backend] Auctions store the fees they were created with (snapshot)
- [ ] T-014.3 [admin] `/pengaturan/biaya` screen
- [ ] T-014.4 [qa] Editing a fee doesn't change an existing auction's fees

### US-015 Admin edits auction settings · `todo`
As an **admin**, I want to change the platform limits so that rules can be tuned.
*(Plan: Structure, Extend, Dead-on-arrival claims)*
- AC1: Editable values: extend window (default 5 min), max lots per auction (20), auction length (1–7 days), claim window (4 h).
- AC2: An extend-window change applies only to auctions that haven't started.
- [ ] T-015.1 [backend] Settings storage + `/admin` routes. → **Q3**
- [ ] T-015.2 [admin] Settings section in `/pengaturan/biaya`
- [ ] T-015.3 [qa] Live auctions keep their original extend window

---

## Epic 2: Becoming a farmer (Milestone 2)

Uses option A from the root `CLAUDE.md`: a member login, `POST /vendor/sellers`,
the seller starts as `pending_approval`, and admin approval grants farmer access.

### US-020 Customer registers a farm · `todo`
As a **customer**, I want to submit a farm registration so that I can sell koi
at auction. *(Plan: Becoming a farmer)*
- AC1: The form requires farm name, location, WhatsApp number, KTP photo, farm photos, and a bank account in my own name.
- AC2: Submitting creates the seller as `pending_approval` under my same email and password.
- AC3: I can see my registration status.
- [ ] T-020.1 [backend] Check which fields Mercur's seller already has, and store the rest (KTP, photos, bank) with a link or custom fields per Mercur docs. List the doc pages used
- [ ] T-020.2 [storefront] Member sign-in with the same credentials + `POST /vendor/sellers` flow
- [ ] T-020.3 [storefront] Farm registration form + status page in the Farmer area
- [ ] T-020.4 [qa] KTP and bank data never appear on public pages

### US-021 Admin approves or rejects a farm · `todo`
As an **admin**, I want to review farm registrations so that only real farmers
can create auctions. *(Plan: Becoming a farmer)*
- AC1: The queue shows KTP, farm photos, bank account name vs the account holder's name.
- AC2: Approving gives farmer access. Rejecting needs a reason the applicant sees.
- [ ] T-021.1 [backend] `/admin` routes that use Mercur's seller approval workflow (don't write a new one)
- [ ] T-021.2 [admin] `/kebun` queue screen
- [ ] T-021.3 [storefront] Farmer area appears after approval and the next member login
- [ ] T-021.4 [qa] An unapproved seller can't reach farmer actions

---

## Epic 3: Auctions for farmers (Milestone 3)

### US-030 Farmer creates an auction · `todo`
As a **farmer**, I want to create an auction with lots so that customers can bid
on my koi. *(Plan: Structure, Pricing per lot, Fees, Delivery)*
- AC1: An auction has one category, a start and an end (1–7 days), and a delivery method (self-delivery or courier).
- AC2: Up to 20 lots. Each lot is one koi, with photos, OB (starting price) and KB (bid step), as integers. No reserve, no buy-it-now.
- AC3: Every lot belongs to the auction's category.
- AC4: The join fee and listing fee come from the fee table. The farmer can't set fees.
- AC5: A banned farmer can't create auctions.
- [ ] T-030.1 [backend] Auction module: `auction` (farmer, category, start, end, join fee, listing fee, delivery method, status), `lot` (OB, KB, current price, end time, winner, final price, status). Links to seller and product
- [ ] T-030.2 [backend] Create-auction workflow that checks the limits from US-015
- [ ] T-030.3 [storefront] Farmer area: create auction and add lots with photos
- [ ] T-030.4 [qa] Limits enforced on the server, not only in the form

### US-031 Listing fee is charged · `todo`
As the **platform**, I want the listing fee charged when an auction is created
so that farmers pay to list. *(Plan: How credit moves 4, Fees)*
- AC1: Listing fee = category listing fee × number of lots, recorded as `listing_fee` (−).
- AC2: If the balance is short, creation is blocked with a "top up" prompt, and nothing is saved.
- AC3: All or nothing: the charge and the auction are saved together, or neither is.
- [ ] T-031.1 [backend] Charge step inside the create workflow, with compensation
- [ ] T-031.2 [storefront] Short-balance prompt that links to top-up
- [ ] T-031.3 [qa] A failure after the charge rolls the charge back. → **Q4, Q5**

### US-032 Admin approves auctions · `todo`
As an **admin**, I want to approve each auction before it's scheduled so that
category, photos and fees are checked. *(Plan: Structure, Fees)*
- AC1: The queue shows category, lots with photos, and fees.
- AC2: Approving moves `draft → scheduled`.
- AC3: Admin can override the listing or join fee for this one auction, with a saved written reason.
- [ ] T-032.1 [backend] Approve workflow + fee override with a reason + `/admin` routes
- [ ] T-032.2 [admin] `/lelang` approval queue
- [ ] T-032.3 [qa] An override without a reason is rejected. → **Q5**

### US-033 Auctions start and farmers track them · `todo`
As a **farmer**, I want to see my auctions and their status so that I know
what's live. *(Plan: Design rules, statuses)*
- AC1: Statuses follow `draft → scheduled → live → closed | cancelled`.
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
As a **joined customer**, I want to bid on a lot so that I can win it. *(Plan: Bidding)*
- AC1: Only joined customers can bid. Not the farmer, not banned users.
- AC2: A bid must be at least current price + KB. → **Q6**
- AC3: The lot row is locked and the server's timestamp decides order. Of two equal bids, the first wins and the second is rejected with the new current price.
- AC4: Bids can't be retracted.
- AC5: Each bid saves bidder, amount, source (`web`) and time.
- [ ] T-042.1 [backend] `bid` model + place-bid workflow with row lock
- [ ] T-042.2 [backend] Store route `POST` bid, identity from `auth_context`
- [ ] T-042.3 [storefront] `BidTerminal` wired to the API, with rejection messages
- [ ] T-042.4 [qa] Concurrent equal bids: exactly one accepted

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
- AC2: Highest bid wins (`won`). No bids gives `unsold`.
- AC3: Winner, final price and close time are saved on the lot, never recomputed from bids.
- [ ] T-050.1 [backend] Close-lots job running a close workflow (idempotent, batched)
- [ ] T-050.2 [backend] The auction becomes `closed` when all its lots are closed
- [ ] T-050.3 [qa] Running the job twice changes nothing; an extended lot isn't closed early

### US-051 Winner and farmer see each other's contact details · `todo`
As a **winner**, I want the farmer's WhatsApp and bank details so that I can pay
within 1×24 hours. *(Plan: Closing and winners)*
- AC1: Only the winner of that lot sees the farmer's WhatsApp and bank account, plus the 1×24 h deadline.
- AC2: The farmer sees only the winner's name and WhatsApp.
- [ ] T-051.1 [backend] Store routes for won lots (winner) and sold lots (farmer), scoped by `auth_context`
- [ ] T-051.2 [storefront] Won lots under `akun`; sold lots in the Farmer area
- [ ] T-051.3 [qa] Other users get 403 or no data

### US-052 Farmer marks paid and shipped · `todo`
As a **farmer**, I want to mark a lot paid and then shipped so that progress is
tracked. *(Plan: Closing, Delivery)*
- AC1: `won → paid → shipped`, in order only.
- AC2: Courier delivery requires a tracking number. Self-delivery doesn't.
- [ ] T-052.1 [backend] Status workflows + store routes (the farmer must own the lot)
- [ ] T-052.2 [storefront] Farmer area actions
- [ ] T-052.3 [qa] States can't be skipped

### US-053 Winner marks delivered · `todo`
As a **winner**, I want to mark the fish delivered so that the sale completes and
the claim window starts. *(Plan: Delivery)*
- AC1: Only the winner can mark `shipped → delivered`.
- [ ] T-053.1 [backend] Delivered workflow + route
- [ ] T-053.2 [storefront] Button on the won lot

### US-054 Winner opens a dead-on-arrival claim · `todo`
As a **winner**, I want to claim within 4 hours if the fish arrives dead or sick
so that I get a refund or a replacement. *(Plan: Dead-on-arrival claims 1–2)*
- AC1: A claim is allowed only within the claim window (4 h, a setting) after delivered.
- AC2: It needs an unboxing video (up to 100 MB) and a remedy choice: full refund or replacement.
- AC3: The farmer and admin are notified. → **Q7**
- [ ] T-054.1 [backend] Moderation module: `claim` model + open-claim workflow; video stored on the VPS file provider
- [ ] T-054.2 [storefront] Claim form with video upload and size limit
- [ ] T-054.3 [qa] Late claims and oversized videos are rejected on the server

### US-055 Farmer responds and admin decides disputes · `todo`
As a **farmer**, I want to accept or dispute a claim, and as an **admin**, I want
to decide disputes, so that claims are fair. *(Plan: Dead-on-arrival claims 3)*
- AC1: The farmer can accept or dispute.
- AC2: A disputed claim goes to admin, whose decision is final and saved with a reason.
- [ ] T-055.1 [backend] Claim decision workflows + routes (store for the farmer, admin for disputes)
- [ ] T-055.2 [storefront] Farmer area claim review with the video
- [ ] T-055.3 [admin] `/klaim` dispute screen

### US-056 Approved claims are resolved · `todo`
As a **winner**, I want an approved claim settled within 3 days so that I'm made
whole. *(Plan: Dead-on-arrival claims 4–6)*
- AC1: The farmer has 3 days to refund directly or ship a replacement, then marks it done. The winner confirms.
- AC2: Missing the 3 days, or refusing an approved claim, makes the farmer eligible for a strike (US-059).
- AC3: The farmer stays responsible even if a courier caused the death.
- [ ] T-056.1 [backend] Claim resolution states + a deadline check in the scheduled job
- [ ] T-056.2 [storefront] Mark done (farmer) and confirm (winner)
- [ ] T-056.3 [admin] Overdue claims are flagged for a strike

### US-057 Winner rates the farmer · `todo`
As a **winner**, I want to rate the farmer after shipping so that other buyers
can judge farms. *(Plan: Ratings)*
- AC1: Available once the lot is `shipped`: 1–5 stars and a comment, once per lot.
- AC2: Ratings show on the farm's page (`mitra/[handle]`).
- [ ] T-057.1 [backend] `farmer_rating` model + workflow + routes
- [ ] T-057.2 [storefront] Rating form + display on the partner page

### US-058 Farmer reports a winner who didn't pay · `todo`
As a **farmer**, I want to report a winner who didn't pay within 1×24 h so that
admin can act. *(Plan: Winner doesn't pay)*
- AC1: The farmer can report after the deadline. The admin reviews it and may give a strike.
- AC2: The farmer may offer the lot to the second-highest bidder at that bidder's price. This is arranged between them, off platform. → **Q8**
- [ ] T-058.1 [backend] Report model/state + routes
- [ ] T-058.2 [storefront] Report button after the deadline
- [ ] T-058.3 [admin] Report review that leads to a strike

### US-059 Strikes and bans · `todo`
As an **admin**, I want to give strikes after checking a report so that repeat
offenders are banned. *(Plan: Strikes)*
- AC1: Admin gives each strike with a reason (winner: didn't pay; farmer: didn't ship a paid lot, or refused an approved claim).
- AC2: 2 active strikes = ban. A banned winner can't join or bid. A banned farmer can't create auctions.
- AC3: Strikes expire after 6 months. Admin can remove a strike with a reason.
- [ ] T-059.1 [backend] `strike` model + give/remove workflows + an active-strike check used by join, bid and create
- [ ] T-059.2 [admin] Strike actions on reports and users
- [ ] T-059.3 [qa] An expired strike no longer counts; the ban lifts when active strikes drop below 2

### US-060 Farmer cancels an auction · `todo`
As a **farmer**, I want to cancel my auction so that I can withdraw it, with
joiners refunded. *(Plan: Cancellations, Refunds in the MVP)*
- AC1: Every customer who joined gets a `refund` (+) of their join fee.
- AC2: The farmer's listing fee isn't refunded.
- AC3: A lot that has bids can be cancelled only by admin. → **Q9**
- [ ] T-060.1 [backend] Cancel workflow: refund each participant, set status `cancelled`
- [ ] T-060.2 [storefront] Cancel action in the Farmer area
- [ ] T-060.3 [qa] Refunds total exactly the join fees collected

### US-061 Claim videos are cleaned up · `todo`
As the **platform**, I want claim videos deleted 30 days after a claim closes so
that storage stays bounded. *(Plan: Dead-on-arrival claims 7)*
- [ ] T-061.1 [backend] The scheduled job deletes the files and keeps the claim record
- [ ] T-061.2 [qa] Only closed claims older than 30 days are affected

---

## Epic 6: Admin operations (Milestone 6)

### US-070 Admin manages users · `todo`
As an **admin**, I want to see users with their strikes and bans so that I can
act on bad actors. *(Plan: Users and roles, Strikes)*
- [ ] T-070.1 [backend] `/admin` user list and detail with wallet, strikes and ban status
- [ ] T-070.2 [admin] `/pengguna` screens

### US-071 Admin spots shill bidding · `todo`
As an **admin**, I want to see bid patterns per bidder and farmer so that I can
spot shill bidding. *(Plan: Fair play)*
- [ ] T-071.1 [backend] `/admin` read route: bids grouped by bidder × farmer. → **Q10**
- [ ] T-071.2 [admin] Pattern view on the user and auction pages

### US-072 Admin monitors live auctions · `todo`
As an **admin**, I want to watch live auctions, remove obviously wrong bids and
cancel lots so that auctions stay fair. *(Plan: Bidding, Cancellations, Milestone 6)*
- AC1: Removing a bid is allowed only for an obvious error, and needs a reason. → **Q11**
- AC2: Only admin can cancel a lot that has bids.
- [ ] T-072.1 [backend] Remove-bid and cancel-lot workflows + `/admin` routes
- [ ] T-072.2 [admin] Live monitoring screen

---

## Epic 7: WhatsApp bot (Milestone 7)

### US-080 WhatsApp number linked to an account · `blocked (Q12)`
As a **customer**, I want my WhatsApp number linked to my account so that I can
bid by WhatsApp. *(Plan: WhatsApp bot: Identity)*
- AC1: One number links to one account.
- AC2: Messages from unknown numbers get a registration link.
- [ ] T-080.1 [ops] Confirm the Qontak API supports incoming messages and template sends, and which plan includes it
- [ ] T-080.2 [ops] Dedicated business number + verified Meta Business account (start early; it can take weeks)
- [ ] T-080.3 [backend] Qontak webhook route + number-to-account lookup

### US-081 Bot sends lot codes on join · `todo`
- AC1: After joining, the user gets the auction's lots with codes and how to bid (`BID A3 5000000`).
- [ ] T-081.1 [backend] Subscriber on join sends the message

### US-082 Bid by WhatsApp · `todo`
- AC1: `BID <lot> <amount>` goes through the same place-bid workflow as the web, with source `whatsapp`.
- AC2: The bot replies "accepted", or "rejected" with the current price.
- [ ] T-082.1 [backend] Command parser that calls the existing workflow (no second rule set)
- [ ] T-082.2 [qa] Web and WhatsApp bids follow identical rules

### US-083 Outbid alert · `todo`
- AC1: When outbid, the user gets the lot, the new price and a ready-to-send `BID` command.
- [ ] T-083.1 [backend] Subscriber on the outbid event + utility template

### US-084 Status command · `todo`
- AC1: `STATUS <lot>` returns the current price and time left.
- [ ] T-084.1 [backend] Command handler (read only)

### US-085 Win message · `todo`
- AC1: The winner gets the farmer's WhatsApp and bank details and the 1×24 h deadline.
- [ ] T-085.1 [backend] Subscriber on lot won + utility template

The website must work without WhatsApp. The bot can launch after the web.

---

## Epic 8: Pilot (Milestone 8)

### US-090 Pilot with friendly farmers · `todo`
- AC1: One or two farmers run real auctions end to end before public launch.
- [ ] T-090.1 [ops] Pilot checklist: register, top up, farm approval, auction, bids, close, pay, ship, deliver
- [ ] T-090.2 [ops] Upgrade routine from the plan: backup, rehearse on a copy, deploy with no live auction, compare wallet totals

---

## Coverage matrix

Every plan section maps to at least one story. The product owner keeps this
table complete.

| Plan section | Stories |
|---|---|
| Users and roles | US-002, US-020, US-021, US-070 |
| Becoming a farmer | US-020, US-021 |
| Store credit wallet: how credit moves | US-010, US-011, US-012, US-031, US-041 |
| Transaction types (`manual_topup`, `join_fee`, `listing_fee`, `adjustment`, `refund`) | US-012, US-041, US-031, US-013, US-060 |
| Wallet rules (integer, append-only, closed loop) | Epic 1 rules, US-010, US-013 |
| Refunds in the MVP | US-060 |
| Fees and fee table | US-014, US-031, US-032, US-041 |
| Lot lifecycle and statuses | US-033, US-050, US-052, US-053, US-054 |
| Structure (20 lots, 1–7 days, approval) | US-015, US-030, US-032 |
| Pricing per lot (OB, KB) | US-030, US-042 |
| Bidding | US-042, US-044, US-072 |
| Extend (anti-sniping) | US-043, US-015 |
| Fair play | US-041, US-042, US-071 |
| Closing and winners | US-050, US-051 |
| Winner doesn't pay | US-058, US-059 |
| Strikes | US-059 |
| Delivery | US-030, US-052, US-053 |
| Dead-on-arrival claims | US-054, US-055, US-056, US-061 |
| Cancellations | US-060, US-072 |
| Ratings | US-057 |
| WhatsApp bot | US-080 – US-085 |
| Technical approach: frontends, shared UI | US-001, US-003 |
| Key flows: live updates, live room | US-045, US-046 |
| Build milestones 1–8 | Epics 0–8 |

## Out of scope for the MVP (from the plan)

Don't build these, and reject stories that need them: online payment gateway,
refunds (except farmer cancel), fixed-price marketplace and cart checkout,
payment held by the platform, proxy bidding, buy-it-now, live video hosting,
withdrawals or transfers of credit.

## Open questions

The plan doesn't answer these. Each one needs an owner decision before its story
is built. Record the answer here and in `docs/mvp-plan.md`.

| # | Question | Blocks |
|---|---|---|
| Q1 | Is the phone number given at registration the WhatsApp number used by the bot, and is it required? | US-002, US-080 |
| Q2 | Where is the platform's bank account (shown on the top-up page) stored: env var, admin setting or constant? | US-011 |
| Q3 | Where are settings stored: a settings module/table, or env/config? | US-015 |
| Q4 | Is the listing fee charged at creation (draft) or at submission for approval? The plan says "creating one". | US-031 |
| Q5 | If admin **rejects** an auction, or **lowers its fee** at approval after the listing fee was charged, is the difference refunded? The plan only allows refunds for farmer cancels. | US-031, US-032 |
| Q6 | Can the **first** bid equal OB, or must it be OB + KB? | US-042 |
| Q7 | How are the farmer and admin notified of a claim: WhatsApp, on-site only, or both? | US-054 |
| Q8 | Does the platform record the second-bidder offer at all, or is it fully off-platform? | US-058 |
| Q9 | Can a farmer cancel an auction after bidding has started (some lots have bids)? Cancellations say yes with refunds, but a lot with bids "can only be cancelled by admin". | US-060 |
| Q10 | What exactly should the shill-bidding view show (fields and thresholds)? | US-071 |
| Q11 | When admin removes a bid, how is the lot's current price restored (previous highest bid)? Does extend still apply? | US-072 |
| Q12 | Qontak API capability and plan (already an open question in the plan). | US-080 – US-085 |

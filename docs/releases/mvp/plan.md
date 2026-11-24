# Koi Store — MVP Plan

Nov 13, 2026 · @Herlina Sunaryanto · updated 2026-11-15 with the owner's answers (D-020 – D-044) · 2026-11-16: D-056, D-057, D-044 on hold · 2026-11-20: D-044 hold re-confirmed, D-063 (bid-removal reason cap), US-093 in MVP scope, bot hold stays (web-only MVP)

## Summary

The MVP is a koi auction platform where farmers run auctions and registered customers bid from the website or WhatsApp. The platform earns only from fees paid out of a prepaid store-credit balance; the winning price is paid directly to the farmer.

- **Customers** top up store credit by transfer to the admin, spend it on auction join fees, then bid.
- **Farmers** start as customers, register a farm, top up, and spend credit on listing fees to create auctions.
- **Winners** pay the farmer; how is open: the owner is recalculating the payment model (D-044 on hold, re-confirmed 2026-11-20), and the winner sees no farmer contact at all. No phone either way (D-052). The farmer handles shipping, to the winner's saved address (D-056).
- **Built on Mercur** (the existing `koi-store` repo), used as the backend only. Every screen (storefront, Farmer area, admin app) is custom-built on one shared design system; auction and wallet are custom modules.

**Out of scope for the MVP:** online payment gateway, refunds (except when a farmer or an admin cancels an auction, D-034), fixed-price marketplace and cart, payment held by the platform, proxy bidding, buy-it-now, live video.

## Users and roles

There are three roles; every farmer is also a customer with the same login.

| Role | Can do | Where |
| --- | --- | --- |
| Customer | Register (phone required; it is the account's WhatsApp number, D-008), see balance and history, join auctions, bid, see won lots and farmer contact | Storefront, WhatsApp |
| Farmer | Everything a customer can, plus register a farm, create auctions and lots, see bidders and winners, mark lots paid and shipped | Farmer area in the storefront |
| Admin | Approve farms and auctions, approve top-ups, adjust balances, edit the fee table and settings (extend window, limits, claim window, platform bank account), moderate bids, issue strikes and bans | Custom admin app |

**Becoming a farmer:** a logged-in customer submits a farm registration: farm name, location, ID card (KTP photo and 16-digit NIK, stored privately and never public, D-017), farm photos, and a bank account in their own name for winners to pay into. The farm's WhatsApp number is the registration phone, copied to the seller and not editable (D-016). Admin approves it, and the account gains farmer access. Admin may instead reject it with a reason the farmer sees; rejection is final, with no resubmission (D-015).

**Account link (settled, D-003):** a farmer is one auth identity whose `app_metadata` holds both `customer_id` and `member_id`. The storefront signs in as customer (for `/store/*`) and as member (for `/vendor/*` with `x-seller-id`) with the same credentials. Farm registration is a member login followed by `POST /vendor/sellers`, which creates the seller as `pending_approval`. Right after that, the farmer logs in as a member again to get a token for the new seller; farmer actions stay closed until the admin approves (`status === open`) (D-030). No custom customer↔seller link.

## Personal data protection
Added 2026-11-15 by the owner (D-039, D-040).
- Every customer's personal data is **encrypted at rest**: KTP/NIK, bank account details, phone numbers and similar PII.
- API results and the frontend show only a **small part** of each value (masked), never the full value, except the owner's own full values on their own record (D-045). This covers the farm registration (US-020), the admin farm queue (US-021), the wallet and top-up tables (US-010 – US-012), contact details (US-051), ratings (US-057), admin screens generally (US-070, US-091) and the new story US-092.
- KTP photos and transfer screenshots stay private files (D-017, D-018). One exception to "no key on a store route": the KTP upload may return its private file **key** to the customer who uploaded it, for their own registration only. Never a URL, never another user (D-040; exception to `packages/api/CLAUDE.md`).
- **Settled:** admins see masked PII everywhere and the full value only through a logged reveal (D-042); encryption is column-level on top of disk encryption and includes the wallet/top-up tables (D-043); the winner sees the full bank account for their own won lot through the same logged reveal (D-044, **on hold; re-confirmed by the owner 2026-11-20**); the farmer reveals the winner's full saved address the same way (D-056).
- **Self-view (D-045):** a person sees their **own** full phone and own bank details on their **own** record — the storefront account screen (`/store/customers/me`) and the farmer's own `/vendor/sellers*` record. Every other caller gets the mask, admins included; PII about anyone else on those screens stays masked.
- **Contact between winner and farmer (D-052, supersedes the D-044 confirmation of 2026-11-15):** no phone either way. No `wa.me` link. The farmer gets the winner's name and the winner's default shipping address: masked (city + province only) on the sold lot, full only through a logged reveal (D-056). The winner gets **no farmer contact at all**: the bank-account reveal (D-044) is on hold, re-confirmed by the owner 2026-11-20; if it returns, it covers number and holder name (D-057).
- **Open, not lost:** `/admin/sellers*` still returns unmasked `payout_account.data`, whose free-form JSON can hold a bank number or phone — masked by US-092 T-092.9. `professional_details` (`corporate_name`, `registration_number`, `tax_id`) stays unmasked deliberately, out of scope unless the owner says otherwise. Column-level encryption (US-092 AC1/AC2, T-092.1, T-092.6) is **not built**; masking lands while encryption remains open, so US-092 isn't complete until then.

## Store credit wallet

Every customer has one rupiah wallet, created when their profile is complete (D-011), whose balance is the sum of its transactions; no balance number is ever overwritten. One wallet per customer is enforced by a database unique constraint.

**How credit moves**

1. User transfers any amount (no minimum) to the platform's bank account. The account is an admin setting stored in the settings table and shown on the top-up page (D-009, D-010).
2. User uploads the transfer screenshot on the site, which creates a pending top-up request, and also sends it to admin on WhatsApp.
3. Admin checks the bank statement and approves the request (or rejects it with a reason). Approval records the top-up.
4. Joining an auction (customer) checks the balance and records a `join_fee`. If the balance is short, joining is blocked with a "top up" prompt.
5. A farmer submits an auction for approval (`draft → pending_approval`, D-031). Submit recomputes the fees from the current fee table (D-032), saves the farmer's `customer_id` from the member token on the auction (D-033), and checks the balance: if it is below the listing fee, submission is refused with a "top up" prompt. The `listing_fee` is recorded on that customer's wallet when the admin approves the auction, using the final fee (after any admin change). Approval checks the balance again and fails if it has dropped below the fee (D-020).

**Transaction types**

| Type | Sign | Reference |
| --- | --- | --- |
| `manual_topup` | + | Admin who recorded it, bank reference |
| `join_fee` | − | Auction joined |
| `listing_fee` | − | Auction approved (D-020) |
| `adjustment` | + or − | Admin, reason (corrections only) |
| `refund` | + | Auction cancelled by its farmer or an admin (join fees only, D-034) |

**Rules**

- Money is stored as whole rupiah in integer columns. `wallet_transaction.amount` has no practical size cap (exact `numeric`, whole rupiah, D-012).
- Transactions are never edited or deleted; a mistake is fixed with an `adjustment`.
- Credit can only pay platform fees. It cannot pay farmers, be withdrawn, or be moved between users. This keeps it closed-loop, the lower-risk case under Bank Indonesia rules (to confirm with someone local).
- **Refunds in the MVP:** only when a farmer or an admin cancels an auction (D-034). Every customer who joined gets a `refund` of their join fee. No refund when a customer leaves an auction, and the farmer's listing fee is not refunded. The listing fee is charged only on approval, so a rejected auction or a lowered fee never needs a refund (D-020).

### Fees

The platform sets every fee from a fee table that admins can edit; farmers and customers never set fees.

- Each **auction has one category**, and every lot in it belongs to that category. The farmer picks it; admin checks it when approving. Mixed fish go in separate auctions, so a buyer never pays a premium fee for a cheap fish.
- **Listing fee (farmer)** = the category's listing fee × the number of lots.
- **Join fee (customer)** = the category's join fee, paid once per auction.
- Admin can change either fee on a single auction when approving it, with a written reason that is saved. Typical reasons: a promotion for a new farm, or a goodwill discount after a problem. Rejecting the auction clears the override; the admin applies it again at approval if it's still wanted (D-032).
- An auction's fees are recomputed from the current fee table every time the farmer submits it (D-032). A fee-table change never alters an auction that is already `scheduled` or later.

**Starting fee table (approved; admins can edit)**

| Category | Example | Listing fee per lot (Rp) | Join fee per auction (Rp) |
| --- | --- | --- | --- |
| Lokal, no certificate | Indonesian-bred, no papers | 50.000 | 100.000 |
| Lokal, with certificate | Indonesian-bred with breeder or show certificate | 100.000 | 250.000 |
| Import, with certificate | Japanese breeder certificate | 200.000 | 500.000 |
| Premium | Show winners, jumbo size, top breeders | 400.000 | 1.000.000 |

## Auction rules

The rules follow the conventions Indonesian koi buyers already use in Facebook and WhatsApp auctions (OB, KB, extend, 1×24 hour payment). Values marked *proposed* still need sign-off.

**Lot lifecycle**

```
Open for bids --(timer ends)--> Any bids?
  |  (bid in last 5 min: extend)     |-- no  --> Unsold
                                     '-- yes --> Won --> Paid --> Shipped --> Delivered
                                                  |                              |
                                     Not paid in 1x24 h            dead or sick: claim with video in 4 h
                                                  |
                                     Strike, offer to 2nd bidder
```

An admin can cancel an open lot (`open → cancelled`, reason saved, no winner, D-035). Each late bid restarts the extend timer (5 minutes by default); a winner who misses the 1×24 hour deadline gets a strike; a winner whose fish arrives dead or sick can claim within 4 hours.

**Structure**

- An **auction** is an event by one farmer with a start time, end time, one category and a join fee. It holds up to **20 lots**, one koi each, and runs **1 to 7 days**. Admin can change both limits.
- Every auction needs **admin approval** before it is scheduled. Admin checks the category, photos and fees. Approval is refused once the auction's start time has passed; the admin rejects it so the farmer picks new dates (D-049).
- Submitting an auction moves it to `pending_approval`; the admin queue lists only those (D-031).
- If the admin **rejects** an auction, it goes from `pending_approval` back to `draft` with a written reason the farmer sees. The farmer fixes it and resubmits. There is no rejected status (D-031).
- The join fee is paid once per auction and covers all its lots (fees come from the fee table above).
- Customers can join at any time until the auction ends, including after bidding has started: while the auction is `scheduled` or `live`, including while a lot runs past `end_at` on extends (D-048).
- Public pages (`/lelang`, lot pages) show auctions that are `scheduled`, `live` or `closed`. A closed lot shows its final price and whether it sold, never the winner's identity, id or any winner field (D-046); its bid history is shown in full with masked names, so the top row shows the winner's masked name (D-051). A cancelled lot inside a public auction stays visible, labelled "Dibatalkan", with no price, no final price, no winner and no bids (D-050).

**Pricing per lot (set by the farmer)**

- **OB (open bid):** starting price.
- **KB (kelipatan bid):** fixed bid step. The first bid on a lot may equal OB; every later bid must be at least current price + KB (D-023).
- No reserve price and no buy-it-now in the MVP.

**Bidding**

- Only customers who joined the auction can bid. Bids come from the website or WhatsApp into the same database.
- The server's timestamp decides order. Of two equal bids, the first recorded wins; the second is rejected with the new current price.
- Bids cannot be retracted. Admin may remove a bid only for an obvious error (such as an extra zero). A removed bid is marked removed, never deleted. The lot's current price goes back to the highest remaining bid, or OB if none is left. Any extend the removed bid caused stays; the end time is never shortened (D-024). Bids can be removed only while the lot is `open`; after close, the fix is a lot cancel. Once no bid is left, the next bid may equal OB again (D-036).
- Bidders are shown masked on the website: the first 3 letters of the first name + `***` + the last 2 characters of the customer id, e.g. "Bud\*\*\*x7". No phone digits; the full name and the id never leave the server; the same bidder masks the same way within an auction. The bid history (masked bidder, amount, time) is shown on open and closed lots (D-051).

**Extend (anti-sniping)**

- A bid in the last **5 minutes** moves that lot's end time to 5 minutes after the bid. It repeats until 5 minutes pass with no bid.
- Admin can change the 5-minute window in settings; the change applies to auctions that haven't started.
- Each lot extends on its own; other lots keep their end time.

**Fair play**

- A farmer cannot join or bid on their own auction.
- Admin can see bid patterns per bidder and farmer to spot shill bidding, and can ban accounts. For each farmer, a bidder table shows bidder, bid count, lots bid on, wins and unpaid wins. A bidder is flagged when at least 50% of their bids are on that farmer's lots, or when they have at least 2 unpaid wins from that farmer. Flags take no automatic action; the admin bans by hand (D-028). An "unpaid win" is a farmer's non-payment report, and every count covers all time (D-037).

**Closing and winners**

- When a lot's end time passes, the system closes it. Highest bid wins; a lot with no bids closes as unsold.
- Winner, final price and close time are saved on the lot.
- The winner sees no farmer contact at all (D-044 on hold, re-confirmed by the owner 2026-11-20). The farmer sees the winner's name and masked address, full address through a logged reveal (D-056). No phone or WhatsApp number either way, and no `wa.me` link (D-052).
- The winner must pay the farmer within **1×24 hours**. The farmer marks the lot paid, then shipped. *(Payment model under review, 2026-11-16: with D-044 on hold the winner has no in-app way to get payment details; the owner's planned direction is Xendit escrow, not yet a decision. See `stories.md` status.)*

**Winner doesn't pay**

- The farmer reports it. Admin checks and gives the winner a strike.
- The farmer may offer the lot to the second-highest bidder at that bidder's price, arranged between them fully off-platform. The platform records nothing about the offer and never reassigns the lot (D-026).

**Strikes (winners and farmers)**

- **Winners** get a strike for not paying within 1×24 hours.
- **Farmers** get a strike for not shipping a paid lot, or for refusing an approved dead-on-arrival claim.
- Admin gives every strike after checking the report. **2 active strikes = ban**: a banned winner can't join or bid; a banned farmer can't create auctions. The ban check on join and bid lands with strikes (US-059), not with join or bid (D-047).
- Every ban or suspend needs a written reason, the same rule as a farm rejection (D-041). This covers Mercur's `POST /admin/sellers/:id/suspend` and every customer ban.
- A farm suspended after approval may still mark its already-sold lots paid and shipped; it can't create auctions or lots. A terminated farm can't (D-054).
- Strikes expire after **6 months**. Admin can remove a strike if there was a good reason.

**Delivery**

- When creating an auction, the farmer chooses how lots are delivered: **self-delivery** (the farmer brings the fish) or **courier** (a shipping company).
- The farmer ships to the winner's **default shipping address** saved on their account. The sold lot shows it masked (city + province; street, second line and postal code not sent); the full address comes only through the farmer's logged reveal for their own sold lot (`pii_reveal_audit`, `record_type` `lot`, field `shipping_address`, one row per reveal). No default address: the farmer sees "Alamat belum diisi" and the winner's won lot prompts them to add one (`/akun/alamat`). No phone either way (D-052, D-056).
- The farmer marks the lot shipped (with tracking number for courier), and the winner marks it **delivered** when the fish arrives.
- If the winner never marks it delivered, the lot stays `shipped`; nothing else happens in the MVP (D-053).

**Dead-on-arrival claims**

1. Within **4 hours** of marking it delivered, the winner can open a claim if the fish is dead, sick or badly stressed. Admin can change the window.
2. The claim needs an **unboxing video** uploaded to the site (up to **100 MB**, about 2 minutes) and the winner's choice of remedy: **full refund** or **replacement fish**.
3. The farmer and admin are notified on the site only (the Farmer area and the admin-koi claim queue; no WhatsApp in the MVP, D-025) and both review the video. The farmer can accept (the claim is then approved at once) or dispute; on a dispute, admin approves or rejects (D-038).
4. If the claim is approved, the farmer has **3 days** from approval (on both paths, D-038) to refund the winner directly or ship a replacement, then marks it done. The winner confirms. If the winner doesn't confirm within **3 days** of it being marked done, the claim confirms automatically (D-027).
5. A farmer who misses the 3 days or refuses an approved claim gets a strike and can be rated badly.
6. **Courier problems:** the farmer stays responsible to the winner even when a courier caused the death, and claims from the courier themselves.
7. Videos are deleted 30 days after the claim is closed. Closed means status `confirmed` or `rejected` (D-027).

**Cancellations (MVP)**

- Customer leaves an auction: no refund.
- Farmer cancels an auction: allowed only before it starts (status `draft`, `pending_approval` or `scheduled`, D-031). Every customer who joined gets their join fee back as a `refund`. The farmer's listing fee is not refunded (D-022).
- Once an auction is `live`, only the admin can cancel it (D-022). Every participant gets their join fee back as a `refund`; the listing fee is not refunded (D-034).
- A lot with bids can only be cancelled by admin: `open → cancelled`, with a saved reason and no winner (D-035).

**Ratings**

- Once the farmer marks a lot shipped, the winner can rate the farmer (1–5 stars and a comment). Ratings show on the farm's page.

## WhatsApp bot

One bot number serves every auction; each message names the lot, so there's no need for a number or group per auction.

**What the bot does**

- **On join:** sends the auction's lots with their codes and how to bid, e.g. "You've joined Auction A. Reply `BID A3 5000000` to bid on lot A3."
- **Bids:** `BID <lot> <amount>` goes through the same rules as a web bid. The bot replies accepted, or rejected with the current price.
- **Outbid alert:** "You've been outbid on A3. Current price Rp 5.200.000. Reply `BID A3 5300000`."
- **Info:** `STATUS A3` returns current price and time left.
- **Win:** sends the farmer's WhatsApp and bank details and the 1×24 hour deadline. *(Conflicts with D-052 (no farmer phone to the winner), D-044 (full bank account only through the logged reveal, on hold) and D-056 (farmer gets the winner's address); open as `mvp-Q38`.)*

**Identity:** a WhatsApp number is linked to one account. It is the phone number given at registration, which is required (D-008). Bids from unknown numbers get a registration link.

**Constraints**

- **Provider: Qontak (Mekari), an official Indonesian WhatsApp provider.** It gives the admin team a shared WhatsApp inbox for transfer proofs and customer chats, local support and IDR invoicing, on a monthly plan. Price is not settled: Qontak's official page shows Service Suite Plus at Rp2.000.000/month with a 5-user minimum, otherwise a quote. The owner stays with Qontak and gets a written quote; the bot waits for it (D-029, `mvp-Q12`). The bot connects through Qontak's API. Unofficial libraries are not used; they risk a ban mid-auction.
- More than 24 hours after the user's last message, the bot can only send pre-approved template messages, charged per message. Outbid, win and join messages need utility templates. From 2026-10-01 Qontak charges per message (non-Lite): Service Rp356,65, Utility Rp366,65, Marketing Rp627,33; VAT not verified. Service messages, including bot replies inside the 24-hour window, are now charged too, with 1,000 free per number per month. Whether utility messages inside an open window are charged is unclear (Meta says yes, Qontak says no) ([Qontak rates](https://help-center.qontak.com/hc/en-us/articles/48430892733465), [Indonesia rate breakdown](https://chatmaxima.com/whatsapp-api-pricing/indonesia/)).
- Needs a dedicated business phone number not used on the normal WhatsApp app, and a verified Meta Business account. Business verification takes up to 14 business days and template review up to 24 hours, so start early. Until verified, Meta allows 250 unique users per 24 hours outside the window (then 2,000), and at most 1 message per user every 6 seconds.
- The website works without WhatsApp, so the bot can launch slightly after the web if approval is slow. **Owner, 2026-11-20: the bot is on a deliberate hold (`mvp-Q12`), so the MVP ships web-only unless the owner reverses this.**

## Technical approach on Mercur

Stay on Mercur as the backend and build every screen ourselves: Mercur's dashboards use Medusa's design system, which can't be redesigned without forking it. Mercur still provides the backend framework, accounts and seller data now, and the marketplace and payment setup for beta.

**Reused from Mercur**

- Backend framework: data models, workflows, scheduled jobs, events, API routes
- Customer and admin user accounts and login
- Seller records and approval data (seller registration is enabled in `medusa-config.ts`)
- Products and images for koi listings
- Mercur's own admin dashboard (`apps/admin`) is not used by the admin team. All admin work, including data fixes, goes through `apps/admin-koi`, so admins get the same `@koi/ui` look and feel as the storefront. Mercur's admin does far more than the team needs. It stays mounted at `/dashboard` for developer emergencies only. No features get built in it

**Frontends (all custom, one design system)**

| App | Who uses it | Notes |
| --- | --- | --- |
| `packages/ui` | All apps | Shared components (buttons, tables, forms, cards) moved out of the storefront, so every app looks the same |
| `apps/storefront-koi` | Customers and farmers | Auctions, lots, account and wallet. Includes the **Farmer area**: farm registration, auctions and lots, bids and winners, paid and shipped, claims, balance |
| `apps/admin-koi` (new) | Admin team | Separate app on its own subdomain, so admin code never reaches customers' browsers. Calls Mercur's admin API and custom routes through `@mercurjs/client` |

Mercur's vendor dashboard (`apps/vendor`) is not used in the MVP.

**Custom modules**

| Module | Tables | Links to Mercur |
| --- | --- | --- |
| Wallet | `wallet` (one per customer, created when the profile is complete, D-011), `wallet_transaction` (type, uncapped whole-rupiah amount, reference, created by), topup\_request (amount, screenshot, status, reviewed by), fee\_category (name, listing fee, join fee) | Customer |
| Auction | `auction` (farmer, start, end, join fee, listing fee, status, payer `customer_id` (D-033), fee override with reason (D-032), rejection reason (D-031)), `lot` (OB, KB, current price, end time, winner, final price, status, cancel reason (D-035)), `bid` (bidder, amount, source web or WhatsApp, time, removed with reason and admin (D-024)), `auction_participant` (customer, joined at) | Seller, customer, product |
| Moderation | `strike` (user, lot, reason, admin), farmer\_rating (lot, winner, stars, comment), claim (lot, video, remedy, status, farmer and admin decisions) | Customer |

**Settings:** every admin-editable platform value (extend window, max lots per auction, auction length, claim window, platform bank account) is stored in a settings table in the database, not in env vars or config (D-010).

**Key flows**

- **Join auction:** one workflow checks balance, records `join_fee`, adds the participant. All or nothing.
- **Approve auction:** one workflow re-checks the balance of the `customer_id` saved on the auction, records `listing_fee` at the final fee, and moves the auction `pending_approval → scheduled`. All or nothing (D-020, D-031, D-033).
- **Place bid:** locks the lot row, checks the bidder joined, amount ≥ OB for the first bid and ≥ current + KB after that (D-023), and not the farmer; saves the bid, updates current price, applies extend, emits an outbid event.
- **Close lots:** a scheduled job every minute closes lots past their end time and saves winner and price.
- **Outbid and win alerts:** event subscribers send WhatsApp messages.
- **Live updates:** the lot page polls every few seconds in the MVP; server-sent events can replace it later.
  - **Bidding on the lot page:** the lot page is the only bidding surface — one lot with its photo, current price, countdown, bid feed, and the join and bid actions (D-064). The separate live room (`/lelang/<lot>/live`, US-046) is removed; old links redirect to `/lelang/<lot>`. No video system is built; a farmer can add a YouTube or Instagram live link that is shown on the lot page.
  - **Claims:** unboxing videos are stored on the VPS (100 MB each, deleted 30 days after the claim closes); delivered and claim deadlines, including the 3-day auto-confirm (D-027), are checked by the same scheduled job.

**Design rules for the MVP**

- Never change Mercur's or Medusa's own code; add around it.
- Integer rupiah everywhere; wallet transactions never edited or deleted.
- Clear statuses: auction `draft → pending_approval → scheduled → live → closed | cancelled` (rejection returns `pending_approval → draft`, D-031); lot `open → unsold | won | cancelled` (D-035), `won → paid → shipped` → delivered | claimed; claim `open → approved | disputed`, `disputed → approved | rejected`, `approved → resolved → confirmed` (D-038, D-027).
- Save results on the lot at close instead of recalculating from bids.
- Personal data is encrypted at rest and masked in API results and the frontend (D-039), except a person's own full values on their own record (D-045); private data stays off public routes (D-017, D-040).
- Every seller suspend and every ban needs a written reason (D-041).
- Error messages the Koi apps show verbatim are Indonesian, written on the backend, rupiah in `id-ID` (D-055).

## Path to beta

Beta v1 is an upgrade of the same Mercur system, not a data migration: same database, new tables and columns added through each module's migrations.

| Beta feature | Effect on MVP data |
| --- | --- |
| Xendit top-ups (invoice or payment link, webhook adds credit) | None. New `xendit_topup` transactions; manual ones stay |
| Refunds | None. Starts using the `refund` type |
| Fixed-price marketplace and checkout | None. Uses Mercur's own order tables; product and order screens are added to the Farmer area and admin app |
| Winner pays through the platform (Xendit, xenPlatform for farmer payouts) | New auctions create an order. Old auctions stay marked "paid outside platform" |
| Proxy bidding, buy-it-now | New columns, empty on old lots |

**Upgrade steps each release:** back up the database, rehearse on a copy of production, deploy when no auction is live, compare wallet totals before and after, keep a rollback ready. Bigger features ship switched off behind a flag.

**Biggest beta task:** Mercur's built-in payouts expect Stripe Connect; paying farmers through Xendit means connecting payouts to xenPlatform.

## Build milestones

Build in this order; each milestone ends with something usable. There is no fixed launch date; the developer works on it full time.

1. **Foundations:** move storefront components into `packages/ui`; set up `apps/admin-koi` with admin login. The customer-to-farmer account link is settled (D-003).
2. **Farmers and wallet:** farm registration in the Farmer area; wallet module; settings table (D-010), before top-ups because it holds the platform bank account; top-up requests with screenshot upload; admin screens for farm approval, top-up approval, adjustments, fee table and settings; balance and history page for users.
3. **Auctions for farmers:** auction and lot module, categories, listing fee charge, create auctions in the Farmer area, admin approval queue.
4. **Joining and bidding on the web:** join fee charge, bid rules with row locking, extend, storefront pages switched from demo data to the API, polling for live prices, bidding on the lot page (D-064).
5. **Closing and after-sale:** close job, winner and farmer contact pages, paid and shipped marks, delivery method and delivered mark, dead-on-arrival claims, ratings, strikes and bans, farmer-cancel refunds.
6. **Admin operations:** remaining admin screens for users and bans, strikes, claim disputes, and monitoring live auctions (remove bids, cancel lots).
7. **WhatsApp bot:** Qontak setup and Meta approval, templates, bid commands, outbid and win alerts.
8. **Pilot:** one or two friendly farmers run real auctions before public launch.

**Personal data (D-039):** US-092 lands with Milestone 2, because farm
registration is the first place KTP/NIK/bank/phone are stored. No PII screen goes
live before it. It is unblocked (`mvp-Q25`, `mvp-Q26` answered by D-042, D-043). **US-093 (orphan KTP cleanup) is in MVP scope
by the owner's 2026-11-20 call** — it is real milestone work, not an optional
follow-up; in the owner's latest order it comes before the pilot.

## Open questions

Full text and options: `stories.md`, Open questions.

**Fees and money**

- [x] Listing fee is checked at submission and charged at approval; no refund on rejection or a lowered fee (D-020, `mvp-Q4`, `mvp-Q5`).
- [x] Fees recomputed on every submit; override cleared on rejection (D-032, `mvp-Q18`).
- [x] Admin cancel refunds every join fee (D-034, `mvp-Q19`).
- [x] Payer `customer_id` saved on the auction at submit (D-033, `mvp-Q24`).

**Auctions**

- [x] Rejection returns the auction to `draft` with a reason (D-021, `mvp-Q13`).
- [x] Farmer cancels only before the start (D-022, `mvp-Q9`).
- [x] First bid may equal OB (D-023, `mvp-Q6`).
- [x] Removed bids are marked removed; price restored; extend kept (D-024, `mvp-Q11`).
- [x] Claim notices on-site only (D-025, `mvp-Q7`).
- [x] Second-bidder offers off-platform (D-026, `mvp-Q8`).
- [x] Claim statuses and 3-day auto-confirm (D-027, `mvp-Q14`).
- [x] Shill-bidding view (D-028, `mvp-Q10`).
- [x] `pending_approval` auction status (D-031, `mvp-Q17`).
- [x] Lot status `cancelled` (D-035, `mvp-Q20`).
- [x] Bid removal only on open lots; OB rule after removals (D-036, `mvp-Q21`).
- [x] Unpaid win = non-payment report, all time (D-037, `mvp-Q22`).
- [x] Public statuses `scheduled`, `live`, `closed`; a closed lot shows final price and sold/unsold, never the winner (D-046, `mvp-Q28`).
- [x] Join ships without a ban check; US-059 adds it to join and bid (D-047, `mvp-Q29`).
- [x] Joining allowed while the auction is `scheduled` or `live`, extensions included (D-048, `mvp-Q30`).
- [x] Approval refused once `start_at` has passed (D-049, `mvp-Q31`).
- [x] A cancelled lot inside a public auction stays visible as "Dibatalkan", no price, no final price, no winner, no bids (D-050, `mvp-Q32`).
- [x] Masked bidder `Bud***x7` (3 letters of first name + last 2 characters of customer id); full masked bid history on open and closed lots; supersedes D-046 in part (D-051, `mvp-Q33`).
- [x] A lot the winner never marks delivered stays `shipped`; no job or setting (D-053, `mvp-Q35`).
- [x] A farm suspended after approval may still mark its sold lots paid and shipped; terminated may not (D-054, `mvp-Q36`).
- [x] Farmer-accepted claim is approved at once; clock starts at `approved` (D-038, `mvp-Q23`).
- [x] Every seller suspend and every ban needs a written reason (D-041).

**Farmers**

- [ ] None open. Farmers use the same strike system as winners.
- [x] Private file key may return to its own uploader for the registration, never a URL and never to another user (D-040).

**Personal data**

- [x] Encrypted at rest; API results and the frontend show masked values only (D-039).
- [x] Column-level encryption for NIK, bank account and phone, on top of disk encryption; the wallet and top-up tables are included in US-092; plain values are migrated in place (D-043, `mvp-Q26`).
- [x] Admins see masked PII everywhere, admin-only routes and UI included; the full value only through an explicit reveal action logged with who, when, record and field (D-042, `mvp-Q25`).
- [x] Winner pays into the farmer's full bank account: visible only for the lot they won, through the same logged reveal (D-044, `mvp-Q27`). **On hold; owner re-confirmed the hold 2026-11-20** (the winner sees no farmer contact at all; US-051's built reveal stays shipped).
- [x] A person sees their own full phone and own bank details on their own record (`/store/customers/me`, own `/vendor/sellers*`); every other caller, admins included, gets the mask (D-045).
- [x] No phone between winner and farmer: the farmer gets the winner's name and masked address, full address through a logged reveal (D-056); the winner's bank-account reveal (D-044) is on hold 2026-11-16; no `wa.me` link. Supersedes the 2026-11-15 "farmer reveals the winner's phone" confirmation (D-052, `mvp-Q34`).
- [x] The farmer ships to the winner's default shipping address: masked (city + province) on the sold lot, full through a logged reveal; no address → "Alamat belum diisi" and a prompt for the winner (D-056, `mvp-Q37`).
- [x] If the winner's bank reveal returns, it covers account number and holder name, one audit row (D-057, `mvp-Q39`; on hold with D-044).
- [ ] What the WhatsApp win message (US-085) sends is open (`mvp-Q38`).
- [ ] Payment model: with D-044 on hold the winner has no in-app way to pay. Owner's planned direction (not a decision): Xendit escrow (`docs/releases/README.md`).
- [ ] `/admin/sellers*` masks `payout_account.data` (free-form JSON can hold a bank number or phone) — US-092 T-092.9. `professional_details` stays unmasked, out of scope unless the owner says otherwise.
- [ ] Column-level encryption (US-092 AC1/AC2, T-092.1, T-092.6) is still not built; masking is done while encryption is not.

**Accounts and settings**

- [x] Registration phone is required and is the WhatsApp number (D-008, `mvp-Q1`).
- [x] Platform bank account is an admin setting (D-009, `mvp-Q2`).
- [x] Settings are stored in a settings table (D-010, `mvp-Q3`).

**Operations**

- [x] Qontak's API supports an inbound webhook, in-window bot replies and template sends (T-080.1 research, 2026-11-14). The owner stays with Qontak (D-029).
- [ ] Owner: get a written Qontak quote (price, Bot + User tokens, webhook access, webhook retry and signature, rate limits, utility charging inside the window, onboarding time). The bot waits for it (`mvp-Q12`).
- [ ] Owner: start Meta Business verification now (up to 14 business days) (D-029).
- [x] Farmer member re-login right after registration (D-030, `mvp-Q16`).
- [x] User-facing error messages are Indonesian, written on the backend; the typed client is not patched (D-055).

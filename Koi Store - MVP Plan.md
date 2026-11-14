# Koi Store — MVP Plan

Nov 13, 2026 · @Herlina Sunaryanto

## Summary

The MVP is a koi auction platform where farmers run auctions and registered customers bid from the website or WhatsApp. The platform earns only from fees paid out of a prepaid store-credit balance; the winning price is paid directly to the farmer.

- **Customers** top up store credit by transfer to the admin, spend it on auction join fees, then bid.
- **Farmers** start as customers, register a farm, top up, and spend credit on listing fees to create auctions.
- **Winners** see the farmer's WhatsApp and bank details and pay them directly. The farmer handles shipping.
- **Built on Mercur** (the existing `koi-store` repo), used as the backend only. Every screen (storefront, Farmer area, admin app) is custom-built on one shared design system; auction and wallet are custom modules.

**Out of scope for the MVP:** online payment gateway, refunds (except when a farmer cancels), fixed-price marketplace and cart, payment held by the platform, proxy bidding, buy-it-now, live video.

## Users and roles

There are three roles; every farmer is also a customer with the same login.

| Role | Can do | Where |
| --- | --- | --- |
| Customer | Register, see balance and history, join auctions, bid, see won lots and farmer contact | Storefront, WhatsApp |
| Farmer | Everything a customer can, plus register a farm, create auctions and lots, see bidders and winners, mark lots paid and shipped | Farmer area in the storefront |
| Admin | Approve farms and auctions, approve top-ups, adjust balances, edit the fee table and extend window, moderate bids, issue strikes and bans | Custom admin app |

**Becoming a farmer:** a logged-in customer submits a farm registration: farm name, location, WhatsApp number, ID card (KTP), farm photos, and a bank account in their own name for winners to pay into. Admin approves it, and the account gains farmer access.

**To verify early:** Mercur treats customers and sellers as separate logins. Linking one person's customer account to their farm needs a check in the Mercur docs before building.

## Store credit wallet

Every account has one rupiah wallet whose balance is the sum of its transactions; no balance number is ever overwritten.

**How credit moves**

1. User transfers any amount (no minimum) to the platform's bank account.
2. User uploads the transfer screenshot on the site, which creates a pending top-up request, and also sends it to admin on WhatsApp.
3. Admin checks the bank statement and approves the request (or rejects it with a reason). Approval records the top-up.
4. Joining an auction (customer) or creating one (farmer) checks the balance and records a fee transaction. If the balance is short, the action is blocked with a "top up" prompt.

**Transaction types**

| Type | Sign | Reference |
| --- | --- | --- |
| `manual_topup` | + | Admin who recorded it, bank reference |
| `join_fee` | − | Auction joined |
| `listing_fee` | − | Auction created |
| `adjustment` | + or − | Admin, reason (corrections only) |
| `refund` | + | Auction cancelled by its farmer (join fees only) |

**Rules**

- Money is stored as whole rupiah in integer columns.
- Transactions are never edited or deleted; a mistake is fixed with an `adjustment`.
- Credit can only pay platform fees. It cannot pay farmers, be withdrawn, or be moved between users. This keeps it closed-loop, the lower-risk case under Bank Indonesia rules (to confirm with someone local).
- **Refunds in the MVP:** only when a farmer cancels an auction. Every customer who joined gets a `refund` of their join fee. No refund when a customer leaves an auction, and the farmer's listing fee is not refunded.

### Fees

The platform sets every fee from a fee table that admins can edit; farmers and customers never set fees.

- Each **auction has one category**, and every lot in it belongs to that category. The farmer picks it; admin checks it when approving. Mixed fish go in separate auctions, so a buyer never pays a premium fee for a cheap fish.
- **Listing fee (farmer)** = the category's listing fee × the number of lots.
- **Join fee (customer)** = the category's join fee, paid once per auction.
- Admin can change either fee on a single auction when approving it, with a written reason that is saved. Typical reasons: a promotion for a new farm, or a goodwill discount after a problem.
- Fee changes apply to auctions created after the change, never to ones already approved.

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

Each late bid restarts the extend timer (5 minutes by default); a winner who misses the 1×24 hour deadline gets a strike; a winner whose fish arrives dead or sick can claim within 4 hours.

**Structure**

- An **auction** is an event by one farmer with a start time, end time, one category and a join fee. It holds up to **20 lots**, one koi each, and runs **1 to 7 days**. Admin can change both limits.
- Every auction needs **admin approval** before it is scheduled. Admin checks the category, photos and fees.
- The join fee is paid once per auction and covers all its lots (fees come from the fee table above).
- Customers can join at any time until the auction ends, including after bidding has started.

**Pricing per lot (set by the farmer)**

- **OB (open bid):** starting price.
- **KB (kelipatan bid):** fixed bid step. Each bid must be at least current price + KB.
- No reserve price and no buy-it-now in the MVP.

**Bidding**

- Only customers who joined the auction can bid. Bids come from the website or WhatsApp into the same database.
- The server's timestamp decides order. Of two equal bids, the first recorded wins; the second is rejected with the new current price.
- Bids cannot be retracted. Admin may remove a bid only for an obvious error (such as an extra zero).
- Bidders are shown masked on the website, e.g. "Bud\*\*\*23".

**Extend (anti-sniping)**

- A bid in the last **5 minutes** moves that lot's end time to 5 minutes after the bid. It repeats until 5 minutes pass with no bid.
- Admin can change the 5-minute window in settings; the change applies to auctions that haven't started.
- Each lot extends on its own; other lots keep their end time.

**Fair play**

- A farmer cannot join or bid on their own auction.
- Admin can see bid patterns per bidder and farmer to spot shill bidding, and can ban accounts.

**Closing and winners**

- When a lot's end time passes, the system closes it. Highest bid wins; a lot with no bids closes as unsold.
- Winner, final price and close time are saved on the lot.
- The winner sees the farmer's WhatsApp and bank account. The farmer sees the winner's name and WhatsApp.
- The winner must pay the farmer within **1×24 hours**. The farmer marks the lot paid, then shipped.

**Winner doesn't pay**

- The farmer reports it. Admin checks and gives the winner a strike.
- The farmer may offer the lot to the second-highest bidder at that bidder's price, arranged between them.

**Strikes (winners and farmers)**

- **Winners** get a strike for not paying within 1×24 hours.
- **Farmers** get a strike for not shipping a paid lot, or for refusing an approved dead-on-arrival claim.
- Admin gives every strike after checking the report. **2 active strikes = ban**: a banned winner can't join or bid; a banned farmer can't create auctions.
- Strikes expire after **6 months**. Admin can remove a strike if there was a good reason.

**Delivery**

- When creating an auction, the farmer chooses how lots are delivered: **self-delivery** (the farmer brings the fish) or **courier** (a shipping company).
- The farmer marks the lot shipped (with tracking number for courier), and the winner marks it **delivered** when the fish arrives.

**Dead-on-arrival claims**

1. Within **4 hours** of marking it delivered, the winner can open a claim if the fish is dead, sick or badly stressed. Admin can change the window.
2. The claim needs an **unboxing video** uploaded to the site (up to **100 MB**, about 2 minutes) and the winner's choice of remedy: **full refund** or **replacement fish**.
3. The farmer and admin are notified and both review the video. The farmer can accept or dispute; if they disagree, admin decides.
4. If the claim is approved, the farmer has **3 days** to refund the winner directly or ship a replacement, then marks it done. The winner confirms.
5. A farmer who misses the 3 days or refuses an approved claim gets a strike and can be rated badly.
6. **Courier problems:** the farmer stays responsible to the winner even when a courier caused the death, and claims from the courier themselves.
7. Videos are deleted 30 days after the claim is closed.

**Cancellations (MVP)**

- Customer leaves an auction: no refund.
- Farmer cancels an auction: every customer who joined gets their join fee back as a `refund`. The farmer's listing fee is not refunded.
- A lot with bids can only be cancelled by admin.

**Ratings**

- Once the farmer marks a lot shipped, the winner can rate the farmer (1–5 stars and a comment). Ratings show on the farm's page.

## WhatsApp bot

One bot number serves every auction; each message names the lot, so there's no need for a number or group per auction.

**What the bot does**

- **On join:** sends the auction's lots with their codes and how to bid, e.g. "You've joined Auction A. Reply `BID A3 5000000` to bid on lot A3."
- **Bids:** `BID <lot> <amount>` goes through the same rules as a web bid. The bot replies accepted, or rejected with the current price.
- **Outbid alert:** "You've been outbid on A3. Current price Rp 5.200.000. Reply `BID A3 5300000`."
- **Info:** `STATUS A3` returns current price and time left.
- **Win:** sends the farmer's WhatsApp and bank details and the 1×24 hour deadline.

**Identity:** a WhatsApp number is linked to one account. Bids from unknown numbers get a registration link.

**Constraints**

- **Provider: Qontak (Mekari), an official Indonesian WhatsApp provider.** It gives the admin team a shared WhatsApp inbox for transfer proofs and customer chats, local support and IDR invoicing, on a monthly plan (one guide cites from about Rp599.000/month). The bot connects through Qontak's API. Unofficial libraries are not used; they risk a ban mid-auction.
- More than 24 hours after the user's last message, the bot can only send pre-approved template messages, charged per message. Outbid and win alerts need utility templates, about Rp357 per message plus VAT in Indonesia per third-party rate tables. They are free while the user's 24-hour window is open, which covers most active WhatsApp bidders ([Qontak rates](https://help-center.qontak.com/hc/en-us/articles/48430892733465), [Indonesia rate breakdown](https://chatmaxima.com/whatsapp-api-pricing/indonesia/)).
- Needs a dedicated business phone number not used on the normal WhatsApp app, and a verified Meta Business account. Verification can take days to weeks, so start early.
- The website works without WhatsApp, so the bot can launch slightly after the web if approval is slow.

## Technical approach on Mercur

Stay on Mercur as the backend and build every screen ourselves: Mercur's dashboards use Medusa's design system, which can't be redesigned without forking it. Mercur still provides the backend framework, accounts and seller data now, and the marketplace and payment setup for beta.

**Reused from Mercur**

- Backend framework: data models, workflows, scheduled jobs, events, API routes
- Customer and admin user accounts and login
- Seller records and approval data (seller registration is enabled in `medusa-config.ts`)
- Products and images for koi listings
- Mercur's own admin dashboard stays mounted as a backup for data fixes, restricted to the developer; not used day to day

**Frontends (all custom, one design system)**

| App | Who uses it | Notes |
| --- | --- | --- |
| `packages/ui` | All apps | Shared components (buttons, tables, forms, cards) moved out of the storefront, so every app looks the same |
| `apps/storefront-koi` | Customers and farmers | Auctions, lots, live room, account and wallet. Includes the **Farmer area**: farm registration, auctions and lots, bids and winners, paid and shipped, claims, balance |
| `apps/admin-koi` (new) | Admin team | Separate app on its own subdomain, so admin code never reaches customers' browsers. Calls Mercur's admin API and custom routes through `@mercurjs/client` |

Mercur's vendor dashboard (`apps/vendor`) is not used in the MVP.

**Custom modules**

| Module | Tables | Links to Mercur |
| --- | --- | --- |
| Wallet | `wallet` (one per account), `wallet_transaction` (type, amount, reference, created by), topup\_request (amount, screenshot, status, reviewed by), fee\_category (name, listing fee, join fee) | Customer |
| Auction | `auction` (farmer, start, end, join fee, status), `lot` (OB, KB, current price, end time, winner, final price, status), `bid` (bidder, amount, source web or WhatsApp, time), `auction_participant` (customer, joined at) | Seller, customer, product |
| Moderation | `strike` (user, lot, reason, admin), farmer\_rating (lot, winner, stars, comment), claim (lot, video, remedy, status, farmer and admin decisions) | Customer |

**Key flows**

- **Join auction:** one workflow checks balance, records `join_fee`, adds the participant. All or nothing.
- **Place bid:** locks the lot row, checks the bidder joined, amount ≥ current + KB, and not the farmer; saves the bid, updates current price, applies extend, emits an outbid event.
- **Close lots:** a scheduled job every minute closes lots past their end time and saves winner and price.
- **Outbid and win alerts:** event subscribers send WhatsApp messages.
- **Live updates:** the lot page polls every few seconds in the MVP; server-sent events can replace it later.
  - **Live room:** a live bidding screen showing one lot at a time with its photo, current price, countdown and bid feed. No video system is built; a farmer can add a YouTube or Instagram live link that is shown on the page.
  - **Claims:** unboxing videos are stored on the VPS (100 MB each, deleted 30 days after the claim closes); delivered and claim deadlines are checked by the same scheduled job.

**Design rules for the MVP**

- Never change Mercur's or Medusa's own code; add around it.
- Integer rupiah everywhere; wallet transactions never edited or deleted.
- Clear statuses: auction `draft → scheduled → live → closed | cancelled`; lot `open → unsold | won → paid → shipped` → delivered | claimed.
- Save results on the lot at close instead of recalculating from bids.

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

1. **Foundations:** move storefront components into `packages/ui`; set up `apps/admin-koi` with admin login; confirm the customer-to-farmer account link in Mercur.
2. **Farmers and wallet:** farm registration in the Farmer area; wallet module; top-up requests with screenshot upload; admin screens for farm approval, top-up approval, adjustments, fee table and settings; balance and history page for users.
3. **Auctions for farmers:** auction and lot module, categories, listing fee charge, create auctions in the Farmer area, admin approval queue.
4. **Joining and bidding on the web:** join fee charge, bid rules with row locking, extend, storefront pages switched from demo data to the API, polling for live prices, live bidding screen.
5. **Closing and after-sale:** close job, winner and farmer contact pages, paid and shipped marks, delivery method and delivered mark, dead-on-arrival claims, ratings, strikes and bans, farmer-cancel refunds.
6. **Admin operations:** remaining admin screens for users and bans, strikes, claim disputes, and monitoring live auctions (remove bids, cancel lots).
7. **WhatsApp bot:** Qontak setup and Meta approval, templates, bid commands, outbid and win alerts.
8. **Pilot:** one or two friendly farmers run real auctions before public launch.

## Open questions

**Fees and money**

- [ ] None open. Fee table approved; one category per auction.

**Auctions**

- [ ] None open. Courier responsibility, the 3-day claim deadline and video limits are decided.

**Farmers**

- [ ] None open. Farmers use the same strike system as winners.

**Operations**

- [ ] Confirm with Qontak that its API lets a custom bot receive incoming messages and send template messages, and which plan includes that.

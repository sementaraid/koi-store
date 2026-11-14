# Koi Store: product overview

This file holds what stays true across releases. Release-specific rules live in
each release's `plan.md` (see `docs/releases/README.md`).

## What it is

Koi Store is an Indonesian koi auction platform. Farmers run auctions, and
registered customers bid from the website or WhatsApp. The platform earns from
fees paid out of a prepaid store-credit wallet. The winning price is paid
directly to the farmer.

It's built on Mercur (Medusa), used as the backend only. Every screen is custom,
on one shared design system (decision D-001).

## Roles

| Role | Who | Where they work |
|---|---|---|
| Customer | Anyone with an account | `apps/storefront-koi`, WhatsApp |
| Farmer | A customer whose farm registration is approved. Same login (D-003) | The Farmer area in `apps/storefront-koi` |
| Admin | The admin team | `apps/admin-koi` only (D-002) |
| Owner | Decides scope and rules, approves plans | — |

## Glossary

Interface copy and URLs are Indonesian. These terms appear in code and docs:

| Term | Meaning |
|---|---|
| Lelang | Auction: an event run by one farmer, holding one or more lots |
| Lot | One koi in an auction |
| Mitra | Farmer or breeder (also the storefront's partner pages) |
| Kebun | Farm (admin farm-registration queue) |
| OB (open bid) | A lot's starting price |
| KB (kelipatan bid) | A lot's fixed bid step |
| Extend | Anti-sniping: a late bid pushes the lot's end time back |
| Saldo | Store-credit balance |
| Top-up | Adding credit by bank transfer, approved by admin |
| Join fee | What a customer pays once to bid in an auction |
| Listing fee | What a farmer pays to list lots |
| KTP | Indonesian ID card, required for farm registration |
| Strike | A penalty from admin. Active strikes can lead to a ban |
| DOA claim | Dead-on-arrival claim for a fish that arrives dead or sick |

## Releases

See `docs/releases/README.md`.

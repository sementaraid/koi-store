# Releases

Each release has its own folder with a `plan.md` (the spec) and a `stories.md`
(the backlog). The process is in `docs/README.md`.

| Release | Status | Plan | Stories | Summary |
|---|---|---|---|---|
| `mvp` | in progress | [plan](mvp/plan.md) | [stories](mvp/stories.md) | Auctions, store-credit wallet, farmer onboarding, admin app, WhatsApp bot |

## Starting a new release

1. Pick a short slug, for example `beta-xendit` or `marketplace`.
2. Copy `_template/` to `docs/releases/<slug>/`.
3. The product-owner fills in `plan.md` from the owner's description, and lists
   every gap as an open question. The owner approves the plan.
4. The product-owner writes `stories.md`. Story IDs continue from the highest
   existing `US-` number in any release.
5. Add a row to the table above with status `planning`. Change it to
   `in progress` when the first story starts.

Several releases can be `in progress` at once. Each story belongs to exactly
one release.

## Ideas not yet planned

Future work that the MVP plan already names, kept here so it isn't lost. Each
item becomes a release when the owner asks for it.

- Xendit top-ups (invoice or payment link; a webhook adds credit)
- Refunds beyond farmer cancellation
- Fixed-price marketplace and checkout
- Winner pays through the platform (Xendit, with xenPlatform for farmer payouts)
- Proxy bidding and buy-it-now

Source: `mvp/plan.md`, Path to beta. Its upgrade steps (backup, rehearse,
deploy with no live auction, compare wallet totals) apply to every release.

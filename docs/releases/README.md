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

- Xendit top-ups (invoice or payment link; a webhook adds credit). See the escrow direction below (owner, 2026-11-16).
- Refunds beyond auction cancellation (farmer or admin, D-034)
- Fixed-price marketplace and checkout
- Winner pays through the platform (Xendit, with xenPlatform for farmer payouts). **Planned direction (owner, 2026-11-16): escrow — winner pays platform via Xendit; farmer payout (xenPlatform) released after winner marks delivered and claim window passes without claim.** Not a decision yet. **Since 2026-11-25 the MVP routes the winning price through the company bank account by hand** (D-068 winner pays the company account, admin confirms; D-069 admin pays the farmer), so Xendit would automate that flow rather than create it.
- Proxy bidding and buy-it-now
- WhatsApp claim notice template for the farmer and admin (MVP notices are on-site only, D-025)
- Auto-confirm delivery N days after a lot is marked shipped (MVP: the lot stays `shipped` if the winner never marks it delivered, D-053)
- KYC verification through http://api.co.id (Indonesian KYC API). Set aside for now, not in the MVP; likely the answer to the farm identity check later. Not scheduled. (Owner, 2026-11-15)
- Phone app: wrap the storefront in a mobile app shell (Cordova or Capacitor; Electron was also mentioned) to publish on the App Store and Play Store. An idea, not a decision, not in any plan and not scheduled (owner, 2026-11-24). Open questions before it becomes a release: (1) which wrapper: Capacitor and Cordova target iOS and Android; Electron builds desktop apps, so it does not reach either phone store; (2) does the app load the hosted site or bundle the pages? The storefront is server-rendered Next.js, so bundling needs a static build it doesn't have today; (3) do the stores accept a thin web wrapper (Apple's minimum-functionality review guideline), and do their in-app payment rules touch wallet top-ups used for join and listing fees (not verified); (4) push notifications for outbid and win, which need a channel the MVP doesn't have (bot held, `mvp-Q12`); (5) store developer accounts are a paid service and need the owner's approval; (6) sign-in cookies and deep links (`/lelang/<lot>`) inside the app. US-107 (shell in the layouts, fixed bars with safe-area padding) is useful groundwork but adds nothing for this.

Source: `mvp/plan.md`, Path to beta. Its upgrade steps (backup, rehearse,
deploy with no live auction, compare wallet totals) apply to every release.

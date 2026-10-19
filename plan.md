# storefront-koi — parity plan with `apps/storefront`

> **STATUS: audit only. Nothing in this file has been implemented.**
>
> **RULE FOR EVERY ITEM BELOW:** when it is implemented, it must follow the
> `apps/storefront` process, flow and pattern — same route shape, same
> server-action contract (`(state, formData)` / `{ ok, error }`), same calls into
> `src/lib/data/*`, same component layering (section → organism → cell → atom).
> Do not invent a new pattern. Port the storefront's, adapt only the copy and
> the visual kit. Where koi already has an equivalent (see §13), keep koi's and
> use storefront only as the behavioural reference.

Audit performed read-only against `apps/storefront` and `apps/storefront-koi`.
Line refs are to this tree at time of writing.

---

## 1. Checkout / payment / order pipeline — **critical, checkout is a dead end**

`apps/storefront-koi/src/lib/data/cart.ts` is byte-for-byte equivalent to
storefront's (all 14 exports present), but koi calls only three of them:
`addToCart`, `updateLineItem`, `deleteLineItem`, plus `setShippingMethod`.

| Step | storefront | storefront-koi |
|---|---|---|
| Delivery address form | `CartAddressSection` → `setAddresses` | **missing.** Address is only picked from the saved book; `Shipping.tsx` carries a `ponytail` note: "no address form here — `addCustomerAddress` exists" |
| Shipping options | `CartShippingMethodsSection` | wired: `setShippingMethod` in `Shipping/components/Checkout.tsx` |
| Payment providers | `CartPaymentSection` → `listCartPaymentMethods` | **never called** (`lib/data/payment.ts` unused) |
| Payment session | `initiatePaymentSession` (`CartPaymentSection.tsx`) | **unused** |
| Card capture | Stripe Elements (`@stripe/react-stripe-js`) | dependency absent |
| Place order | `PaymentButton` → `placeOrder` → redirect `/order/:id/confirmed` | **unused.** `placeOrder` never called anywhere |
| Promo codes | `PromoCode` organism → `applyPromotions` / `deletePromotionCode` | **unused.** No promo input on cart |
| Order confirmation | `(main)/order/[id]/confirmed` + `OrderConfirmedSection` | **no route, no component** |
| `removeShippingMethod` | used | unused |

Concrete dead end: `Shipping/components/Checkout.tsx` renders `ShippingPage`
without `onCheckout`; the rail's last button still reads **"Lanjut ke
pembayaran"**, so from `/pengiriman` there is no path to paying. The checkout
step indicator (`CartSteps`) already declares `cart → shipping → payment`;
`payment` is unreachable.

Required, in storefront's order:
1. `setAddresses` form on the delivery step (same `useActionState` pattern).
2. `listCartPaymentMethods` + `initiatePaymentSession` payment section.
3. `placeOrder` commit + `/order/[id]/confirmed` page.
4. Promo code input using the existing `applyPromotions` / `deletePromotionCode`.
5. `PaymentButton` equivalent dispatching manual vs Stripe the way storefront's
   `isManual` / `isStripe` switch does.

---

## 2. Missing routes / pages

koi `src/app` (19 routes) vs storefront (23 routes):

**Missing from koi entirely**
- `categories` and `categories/[category]` — catalog has no category landing
  page or filtered category page (`listCategories`, `getCategoryByHandle` are
  present in `lib/data/categories.ts` and never imported).
- `collections/[handle]` — `lib/data/collections.ts` never imported.
- `sellers/[handle]` — no seller page; product page cannot link to the seller.
- `order/[id]/confirmed`.
- `user/returns`, `user/orders/[id]/return`, `user/orders/[id]/request-success`
  and the matching data calls `createReturnRequest`, `getReturns`,
  `retrieveReturnReasons`, `retrieveReturnMethods` (all absent from koi's
  `lib/data/orders.ts`).
- `user/messages` (TalkJS inbox) — see §11.
- `user/register` (storefront's post-signup profile completion).

**Present but thinner**
- `produk/[handle]` exists, but see §4.
- `toko` (marketplace) exists but is not a seller directory, see §3.

**System files missing at `src/app` root**
- `not-found.tsx`
- `global-error.tsx`
- `robots.ts`

(koi has none of the three; storefront has all three. `api/revalidate/route.ts`
exists in both and is equivalent.)

---

## 3. Catalog / marketplace are the same unfiltered feed

`CatalogPage.tsx` and `MarketplacePage.tsx` both call
`listProducts({ countryCode, queryParams: { limit: FEED_LIMIT } })` (limit 100)
and map through `toSimpleProducts`. Consequences:

- `/katalog` and `/toko` show the **same products**; koi-vs-equipment split is
  cosmetic (`Catalogs` vs `Marketplace` copy only).
- Filter, category and sort are **client-side only** (`filterGoods` over the
  whole 100-item fetch; `ponytail` in `CatalogsFeed.tsx` admits this).
- `category` values in `const/catalog.ts` are demo constants (`Kohaku`, `Sanke`,
  …), not Medusa categories.
- No pagination against the backend; `FEED_LIMIT = 100` is the ceiling.

Storefront by contrast: `ProductListing` + `SearchProductsListing` drive
`searchProducts`, `getSearchFacets`, category/collection ids and `sortBy` from
URL params, server-side.

---

## 4. Product detail page gaps

`ProductDetailsPage.tsx` does fetch offers and picks the buybox winner
(`getBuyboxWinner(rankOffers(offers))` → `offerId`), so buying works. Missing
vs storefront's `ProductDetails` + `ProductDetailsSeller` +
`CompareOffersModal`:

- **No offers comparison.** Only the winning offer is used; storefront opens
  `CompareOffersModal` with every ranked offer, seller, logo and premium flag.
- **No seller identity card / link.** `ProductDetailsSeller` is absent, no
  `sellers/[handle]` destination.
- **No reviews** (`ProductDetailsSellerReviews`).
- **No variant selector.** `ProductDetail` adds `quantity: 1` only.
- **No suspended-seller guard.** Storefront returns `NotFound` when
  `seller.store_status === "SUSPENDED"`.
- No "similar items" scoped to seller; the shelf is the whole catalog.
- No shipping/measurement/report/chat blocks from the storefront product page.

---

## 5. Auction / live are demo-only

- `HomePage`, `AuctionsPage`, `LivePage`, `LotDetailsPage` all read the kit's
  static constants (`DEFAULT_AUCTION_LOTS`, demo floor). Comments confirm:
  `packages/api` has no auction module.
- `LotPage` places **no bid** — the CTA routes to `/live?lot=id`, countdown and
  bid count are decoration.
- Sidebar links to `/panduan`, `/mitra`, `/rekber`, `/saldo`, `/watchlist`,
  `/tagihan`, `/kontak` (`const/routes.ts`) — **none of these pages exist.**

---

## 6. Navigation, footer, search

- **Search is unwired.** `SearchField` supports `onSearch`, and `PageShell` /
  `Header` pass it through, but no section supplies one. The form therefore
  falls back to a native GET on the current path (`?q=` ignored everywhere).
  `searchProducts` is never called.
- Footer (`const/footer.ts`) links to `/penitip`, `/pembayaran`, `/karantina`,
  `/garansi`, `/sertifikat`, `/bantuan`, `/panduan`, `/kontak`, `/kemitraan`,
  `/syarat`, `/privasi`, `/regulasi`, `/status`, `/lelang/kilat`,
  `/lelang/hasil` — **none exist**.
- Header's nav is koi-specific (`/lelang`, `/katalog`, `/toko`, `/live`) and
  fine; it has no search handler (above) and no locale/country selector
  (storefront has a country selector driven by regions).

---

## 7. Brand assets missing

- `apps/storefront-koi/public/` **does not exist**.
- `const/header.ts` sets `DEFAULT_BRAND_ICON = "/logo-mark.png"` — resolves to
  nothing; `BrandMark` falls back to a lucide `Fish`.
- Storefront ships `public/Logo.svg`, `Logo.png`, OG image, images, placeholder.
- `metadataBase` defaults to `http://localhost:3001` in koi's root layout.

---

## 8. Session / auth differences

| | storefront | storefront-koi |
|---|---|---|
| Route guard | `middleware.ts` protects `PROTECTED_ROUTES`, deletes expired JWT, supports `sessionExpired` | **no middleware.** Per-page `requireCustomer(from)` in `lib/guard.ts` redirects to `/masuk?sessionRequired=true&redirect=…` |
| `isTokenExpired` | used in middleware | present but unused |
| Cache-id cookie `_medusa_cache_id` | set in middleware | **never set**; `getCacheTag` in `lib/data/cookies.ts` always returns `''`, so `getCacheOptions` is a no-op and authenticated fetches are not per-user cached |
| Auth routes | `/login`, `/register`, `/forgot-password`, `/reset-password` | `/masuk`, `/daftar`, `/lupa-sandi`, `/atur-sandi` (Indonesian; equivalent) |
| Sign out | shared | POST `/keluar` route → `signout()` (intentional, keep) |

Gap to close: token-expiry handling and cache-id cookie. Decide explicitly
whether to adopt middleware or extend `requireCustomer`; do not leave both.

---

## 9. Cart totals / money display

- koi's cart builds totals **client-side** from line items
  (`lib/helpers/cart-totals.ts`: `lineTotal = unit_price × units`).
- Storefront reads `item_subtotal`, `shipping_subtotal`, `tax_total`,
  `discount_subtotal`, `total` from the Medusa cart and draws each row.
- Result: koi shows no shipping, tax, or discount rows, and its total can
  disagree with `cart.total`. `lib/adapters/cart.ts` has an explicit `ponytail`
  admitting discounted line prices read as undiscounted.
- Fix by displaying the cart's own totals (storefront pattern), not by
  extending the client arithmetic.

---

## 10. Account area gaps

Present and generally good: `/akun`, `/akun/pesanan`, `/akun/pesanan/[id]`,
`/akun/alamat`, `/akun/pengaturan`.

Missing vs storefront:
- **Returns**: request flow, return list, request-success page (§2).
- **Messages**: customer ↔ seller chat (§11).
- **Order actions**: order detail is read-only. Storefront's
  `OrderParcelActions` renders return/track per parcel; koi has no return,
  no track, no cancel, no parcel timeline (it does have a status badge via
  `orderStatus`, keep that).
- **Password**: koi sends a reset email from Settings (same end state as
  storefront's `ProfilePassword`), but never renders `ProfilePasswordForm`
  inline. Storefront also offers the direct `updateCustomerPassword` form on
  `/reset-password`; koi's `/atur-sandi` uses the token — equivalent. Optional
  parity only, no functional loss.

---

## 11. Dependencies / feature modules absent from koi

Only in storefront: `@stripe/react-stripe-js`, `@stripe/stripe-js`,
`talkjs`, `@talkjs/react`, `@medusajs/ui`, `@medusajs/icons`,
`@medusajs/medusa`, `i18next` (+ react/browser detector), `js-cookie`,
`lodash`, `sanitize-html`, `react-country-flag`, `uuid`, Storybook.

Only in koi: `@base-ui/react`, `@fontsource-variable/geist`,
`@tailwindcss/postcss`, `class-variance-authority`, `cn`, `lucide-react`,
`tw-animate-css`, `sonner`.

Implications if full parity is wanted:
- **Stripe** — required for the payment step (§1).
- **TalkJS** — required for messages (§2/§10).
- **Storybook** — storefront documents components; koi has none.
- **i18n** — note: storefront has the `[locale]` segment and i18n packages but
  **no `useTranslation` / `i18next` call sites** (English strings hard-coded).
  koi is intentionally single-locale (`<html lang="id">`, root layout comment).
  Do **not** add i18n; treat koi's Indonesian-only choice as canonical.

---

## 12. Deliberate koi choices — keep as-is

- Indonesian URL shape and copy (`/masuk`, `/katalog`, `ROUTES` map).
- No `[locale]` segment; `lang="id"` stated once in root layout.
- POST sign-out route.
- `lib/guard.ts` `requireCustomer` (if middleware is not adopted).
- Extra `address_name` support in address forms (`addCustomerAddress` reads a
  field storefront's does not) — additive, safe.
- Typed `import type`, small helper/adapters layer (`lib/adapters/*`).
- 14 unit tests (`node --experimental-strip-types --test`), storefront has 0.
- Client-side `filterGoods` is acceptable **only** at the demo scale; see §3.

---

## 13. Verification checklist for whoever implements

1. `bun run dev`; add a product → `/keranjang` → `/pengiriman` → set address →
   choose shipping → **pay** → land on order-confirmed with a real order id.
2. `placeOrder`, `initiatePaymentSession`, `setAddresses`,
   `listCartPaymentMethods`, `applyPromotions` each have a call site outside
   `lib/data` (grep is currently empty).
3. An anonymous request to every `/akun/*` URL redirects to `/masuk`; an expired
   JWT is treated as signed out.
4. `/katalog` and `/toko` are no longer identical result sets.
5. Header search submits to a real search page and returns filtered products.
6. No footer/nav link 404s (grep `const/footer.ts` and `const/routes.ts` against
   `src/app`).
7. `public/logo-mark.png` exists and the header renders it.
8. `not-found.tsx`, `global-error.tsx`, `robots.ts` exist and respond.
9. Cart shows item / shipping / tax / discount / total from the cart object.
10. `tsc --noEmit` and `node --experimental-strip-types --test 'src/**/*.test.ts'`
    stay green (currently 0 errors, 77/77 tests).

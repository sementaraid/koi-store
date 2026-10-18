import type { HttpTypes } from '@medusajs/types';

import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  rankOffers,
  type StoreOffer
} from '../helpers/buybox.ts';
import type {
  SimpleProduct,
  StockLevel,
  SupplyStock
} from '@/types/product';

/**
 * Medusa/Mercur reads → the koi kit's presentation type.
 *
 * The kit's pages take `SimpleProduct`, which is a *listing* shape: a price, a
 * stock band, a seller, a category. Nothing in `lib/data/*` knows about it —
 * those modules return raw `StoreProduct` / `OfferDTO` — so the mapping lives
 * here, once, instead of in nine pages.
 *
 * Price and stock come from the offer, not the product: in Mercur a product is
 * a shared master record and every sellable fact (price, inventory, who sells
 * it) hangs off an offer. With several offers, the buybox winner is the one the
 * card speaks for — the same ranking the product page's buybox uses, so a tile
 * and the page behind it never quote different money.
 *
 * Falls back to the master variant's `calculated_price` when no offer is
 * supplied, which is what a bare `listProducts()` call gives.
 */

/** How deep a count counts as low. The shop's own number, not Medusa's. */
const LOW_STOCK_AT = 10;

/** A unit count in the shelf's vocabulary. */
export function toSupplyStock(count: number): SupplyStock {
  const level: StockLevel =
    count <= 0 ? 'out-of-stock' : count <= LOW_STOCK_AT ? 'low-stock' : 'in-stock';

  return { level, count };
}

/**
 * One product, as a card or a feed draws it.
 *
 * @param product - A `StoreProduct` as `listProducts` returns it.
 * @param offers - Every offer on that product, if the caller fetched them.
 *   Ranked here, so the caller can pass the raw list.
 */
export function toSimpleProduct(
  product: HttpTypes.StoreProduct,
  offers: StoreOffer[] = []
): SimpleProduct {
  const winner = getBuyboxWinner(rankOffers(offers));

  const variant = product.variants?.[0];
  const variantPrice = variant?.calculated_price;

  const price = winner
    ? getOfferAmount(winner) ?? 0
    : variantPrice?.calculated_amount ?? 0;

  const currency = (
    winner?.calculated_price?.currency_code ??
    variantPrice?.currency_code ??
    'idr'
  ).toUpperCase();

  /* An offer always carries a count (`+inventory_quantity` is requested on
     every offer read). A bare product read may not, and an absent count is not
     a count of zero — a product with untracked inventory would otherwise read
     as sold out — so the band is left unsaid instead. */
  const count = winner
    ? getOfferStock(winner)
    : (variant as { inventory_quantity?: number | null } | undefined)
        ?.inventory_quantity;

  const seller = winner?.seller;

  return {
    kind: 'simple',
    /* The handle, not the uuid: the kit's `id` is what every link to an item is
       built from (`koiHref`/`goodHref` → `/produk/:id`), and the product route
       looks a product up by handle. Falls back to the id for a product the
       catalog never gave one. */
    id: product.handle || product.id,
    title: product.title,
    image: product.thumbnail ?? undefined,
    listing: {
      ref: winner?.sku || undefined,
      seller: seller?.name,
      /* The kit tells a farm (breeds its own koi) from a shop (resells), and
         Mercur records no such distinction on a seller — so every seller reads
         as a shop until one does.
         ponytail: hardcoded; read it off `seller.metadata.kind` once sellers
         are onboarded with one. */
      sellerKind: seller ? 'shop' : undefined,
      category: product.categories?.[0]?.name,
      spec: variant?.title && variant.title !== 'Default' ? variant.title : undefined
    },
    sale: {
      price,
      currency,
      ...(typeof count === 'number' ? { stock: toSupplyStock(count) } : {})
    }
  };
}

/** A feed's worth of products, with no offers to hand. */
export function toSimpleProducts(
  products: HttpTypes.StoreProduct[]
): SimpleProduct[] {
  return products.map((product) => toSimpleProduct(product));
}

import type { HttpTypes } from '@medusajs/types';

import type { CartLine } from '@/types/cart';
import type { SimpleProduct } from '@/types/product';

import { toSupplyStock } from './product';

/**
 * A Medusa cart → the koi kit's cart lines.
 *
 * The kit's rows take a `Product` and a count; a Medusa line item already is
 * the product read commercially — its own price, its own seller (the offer's),
 * its own quantity — so the mapping is per item rather than back through
 * `toSimpleProduct`, which only knows the catalog read.
 *
 * Every line here is `kind: 'simple'`: a won lot is an auction line, and there
 * is no auction module behind this storefront yet.
 *
 * ponytail: `unit_price` is taken as-is. Line-level promotions live on
 * `item.total`, so a discounted cart shows the undiscounted row price — read
 * `item.total / quantity` here once promotions are offered.
 */
export function toCartLines(cart: HttpTypes.StoreCart | null): CartLine[] {
  return (cart?.items ?? []).map((item) => ({
    product: toCartProduct(item, cart!.currency_code),
    quantity: item.quantity
  }));
}

/**
 * Which cart line each product row stands for.
 *
 * The kit's handlers report a `Product`, and Medusa's mutations take a line id —
 * one is not derivable from the other (two sellers' offers on one product are
 * two lines), so the pairing is carried beside the lines.
 */
export function toLineIds(cart: HttpTypes.StoreCart | null): Record<string, string> {
  const ids: Record<string, string> = {};

  for (const item of cart?.items ?? []) {
    ids[lineKey(item)] = item.id;
  }

  return ids;
}

/** The id a cart row is keyed and linked by — see {@link toCartProduct}. */
export function lineKey(item: HttpTypes.StoreCartLineItem): string {
  return item.product?.handle || item.product_id || item.id;
}

function toCartProduct(
  item: HttpTypes.StoreCartLineItem,
  currency: string
): SimpleProduct {
  const offer = (item as { offer?: { seller?: { name?: string } } }).offer;
  const count = (item.variant as { inventory_quantity?: number | null } | undefined)
    ?.inventory_quantity;

  return {
    kind: 'simple',
    /* The handle, so the row's link lands on `/produk/:handle` — the same id
       `toSimpleProduct` gives a tile. */
    id: lineKey(item),
    title: item.product_title ?? item.title,
    image: item.thumbnail ?? undefined,
    listing: {
      seller: offer?.seller?.name,
      sellerKind: offer?.seller ? 'shop' : undefined,
      spec:
        item.variant_title && item.variant_title !== 'Default'
          ? item.variant_title
          : undefined
    },
    sale: {
      price: item.unit_price ?? 0,
      currency: currency.toUpperCase(),
      /* A stock band is what makes a line countable in the kit's arithmetic
         (`isCounted`), and anything in a Medusa cart is sold by the unit. The
         count is published only where the variant carries one — a band without
         a figure says "available" without inventing an inventory. */
      stock: typeof count === 'number' ? toSupplyStock(count) : { level: 'in-stock' }
    }
  };
}

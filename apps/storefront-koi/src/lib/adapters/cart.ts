import type { HttpTypes } from '@medusajs/types';

import type { CartLine, CartMoney } from '@/types/cart';
import type { SimpleProduct } from '@/types/product';

import { toSupplyStock } from './product.ts';

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

/**
 * What the house's own cart says the bill is — see {@link CartMoney}.
 *
 * @param cart - The Medusa cart, or `null` before one exists.
 *
 * @remarks
 * Read rather than computed, and absent rather than zeroed: a cart with no
 * `total` yet gets `undefined` back, which is the rail's signal to fall back to
 * the kit's own arithmetic instead of drawing `Rp 0` over a cart that has
 * things in it.
 *
 * `shipping`, `tax` and `discount` are dropped when they are zero, because the
 * rail draws a row per figure it is given and "Ongkir Rp 0" on the cart step
 * reads as free shipping rather than as not-yet-priced.
 */
export function toCartMoney(cart: HttpTypes.StoreCart | null): CartMoney | undefined {
  if (!cart || typeof cart.total !== 'number') return undefined;

  const shipping = cart.shipping_subtotal ?? 0;
  const tax = cart.tax_total ?? 0;
  const discount = cart.discount_total ?? 0;

  return {
    items: cart.item_subtotal ?? 0,
    ...(shipping ? { shipping } : {}),
    ...(tax ? { tax } : {}),
    ...(discount ? { discount } : {}),
    total: cart.total,
    currency: (cart.currency_code ?? 'IDR').toUpperCase()
  };
}

/** What one unit of a line costs after its own promotions. */
function discountedUnitPrice(item: HttpTypes.StoreCartLineItem): number {
  const quantity = item.quantity || 1;

  return typeof item.total === 'number'
    ? item.total / quantity
    : (item.unit_price ?? 0);
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
      /* Per unit, so the kit's `price × quantity` agrees with Medusa's own
         `item.total` — a line promotion lowers `total` but leaves
         `unit_price` alone, so the divided figure is the discounted one. */
      price: discountedUnitPrice(item),
      currency: currency.toUpperCase(),
      /* A stock band is what makes a line countable in the kit's arithmetic
         (`isCounted`), and anything in a Medusa cart is sold by the unit. The
         count is published only where the variant carries one — a band without
         a figure says "available" without inventing an inventory. */
      stock: typeof count === 'number' ? toSupplyStock(count) : { level: 'in-stock' }
    }
  };
}

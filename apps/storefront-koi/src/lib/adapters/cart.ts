import type { HttpTypes } from '@medusajs/types';

import type { CartLine, CartMoney } from '@/types/cart';
import type { SimpleProduct } from '@/types/product';

import { toSupplyStock } from './product.ts';

export function toCartLines(cart: HttpTypes.StoreCart | null): CartLine[] {
  return (cart?.items ?? []).map((item) => ({
    product: toCartProduct(item, cart!.currency_code),
    quantity: item.quantity
  }));
}

export function toLineIds(cart: HttpTypes.StoreCart | null): Record<string, string> {
  const ids: Record<string, string> = {};

  for (const item of cart?.items ?? []) {
    ids[lineKey(item)] = item.id;
  }

  return ids;
}

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

function discountedUnitPrice(item: HttpTypes.StoreCartLineItem): number {
  const quantity = item.quantity || 1;

  return typeof item.total === 'number'
    ? item.total / quantity
    : (item.unit_price ?? 0);
}

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
      price: discountedUnitPrice(item),
      currency: currency.toUpperCase(),
      stock: typeof count === 'number' ? toSupplyStock(count) : { level: 'in-stock' }
    }
  };
}

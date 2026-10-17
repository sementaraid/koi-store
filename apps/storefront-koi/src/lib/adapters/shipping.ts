import type { HttpTypes } from '@medusajs/types';

import type {
  ShippingAddress,
  ShippingOption,
  ShippingParcel
} from '@/components/types/shipping';
import type { StoreCardShippingMethod } from '@/lib/data/fulfillment';

import { toCartLines } from './cart';

/**
 * A Medusa cart plus its shipping options → the kit's parcels.
 *
 * The kit's unit of delivery is a parcel: one seller's items travelling
 * together, with the options the house offers for them and the one taken. Mercur
 * already prices shipping per seller (the options come back grouped by seller
 * id), so the grouping is the same on both sides and the join is by seller.
 *
 * ponytail: every parcel is `"courier"`. The `"live"` mode is the air-cargo
 * treatment a fish gets — it asks the visitor for an arrival day — and nothing
 * in a Medusa product says a line is livestock. Key it off a product type or
 * tag once the catalog carries one.
 */
export function toShippingParcels(
  cart: HttpTypes.StoreCart | null,
  options: StoreCardShippingMethod[] | null
): ShippingParcel[] {
  if (!cart) return [];

  const lines = toCartLines(cart);
  const taken = new Set(
    (cart.shipping_methods ?? [])
      .map((method) => method.shipping_option_id)
      .filter(Boolean) as string[]
  );

  /* Options by the seller they are offered for. A seller with no options still
     gets a parcel — the visitor has to see what cannot be shipped yet. */
  const bySeller = new Map<string, ShippingOption[]>();
  for (const option of options ?? []) {
    const key = option.seller_name ?? '';
    const list = bySeller.get(key) ?? [];
    list.push(toShippingOption(option));
    bySeller.set(key, list);
  }

  /* Lines by seller, in cart order, so a parcel reads as the visitor added it. */
  const groups = new Map<string, ShippingParcel['items']>();
  for (const line of lines) {
    const key = line.product.listing?.seller ?? '';
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }

  return [...groups].map(([seller, items], i) => {
    const offered = bySeller.get(seller) ?? [];
    const chosen = offered.find((option) => taken.has(option.id));

    return {
      key: `p${i + 1}`,
      ...(seller ? { seller } : {}),
      items,
      mode: 'courier' as const,
      options: offered,
      ...(chosen ? { choice: { optionId: chosen.id } } : {})
    };
  });
}

/**
 * One option the house offers.
 *
 * `amount` is what the cart would pay: a flat option's stored price, or — for a
 * `calculated` one — what the provider quoted against this cart.
 */
function toShippingOption(option: StoreCardShippingMethod): ShippingOption {
  return {
    id: option.id,
    title: option.name,
    ...(typeof option.amount === 'number' ? { price: option.amount } : {})
  };
}

/**
 * The customer's filed addresses, as the picker lists them.
 *
 * A guest has none, and the page is handed an empty list rather than an invented
 * address — the kit draws its own demo addresses only when the prop is left out,
 * which is the caller's decision, not this function's.
 */
export function toShippingAddresses(
  customer: HttpTypes.StoreCustomer | null
): ShippingAddress[] {
  return (customer?.addresses ?? []).map((address) => ({
    id: address.id,
    name:
      address.address_name ||
      [address.first_name, address.last_name].filter(Boolean).join(' ') ||
      'Alamat',
    ...(address.is_default_shipping ? { tag: 'Utama' } : {}),
    line: [
      address.address_1,
      address.address_2,
      address.city,
      address.province,
      address.postal_code
    ]
      .filter(Boolean)
      .join(', ')
  }));
}

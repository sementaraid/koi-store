import type { HttpTypes } from '@medusajs/types';

import type {
  ShippingAddress,
  ShippingOption,
  ShippingParcel
} from '@/types/shipping';
import type { StoreCardShippingMethod } from '@/lib/data/fulfillment';

import { toCartLines } from './cart';

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

  const bySeller = new Map<string, ShippingOption[]>();
  for (const option of options ?? []) {
    const key = option.seller_name ?? '';
    const list = bySeller.get(key) ?? [];
    list.push(toShippingOption(option));
    bySeller.set(key, list);
  }

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

function toShippingOption(option: StoreCardShippingMethod): ShippingOption {
  return {
    id: option.id,
    title: option.name,
    ...(typeof option.amount === 'number' ? { price: option.amount } : {})
  };
}

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

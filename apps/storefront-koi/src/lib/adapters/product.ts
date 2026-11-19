import type { HttpTypes } from '@medusajs/types';

import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  getVariantOffers,
  rankOffers,
  type StoreOffer
} from '../helpers/buybox.ts';
import type {
  SimpleProduct,
  StockLevel,
  SupplyStock
} from '@/types/product';

const LOW_STOCK_AT = 10;

export function toSupplyStock(count: number): SupplyStock {
  const level: StockLevel =
    count <= 0 ? 'out-of-stock' : count <= LOW_STOCK_AT ? 'low-stock' : 'in-stock';

  return { level, count };
}

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

  const tracked = variant as
    | { inventory_quantity?: number | null; manage_inventory?: boolean }
    | undefined;

  const count = winner ? getOfferStock(winner) : tracked?.inventory_quantity;

  const stock =
    typeof count === 'number'
      ? toSupplyStock(count)
      : variant && tracked?.manage_inventory === false
        ? ({ level: 'in-stock' } satisfies SupplyStock)
        : undefined;

  const seller = winner?.seller;

  return {
    kind: 'simple',
    id: product.handle || product.id,
    title: product.title,
    image: product.thumbnail ?? undefined,
    listing: {
      ref: winner?.sku || undefined,
      seller: seller?.name,
      sellerKind: seller ? 'shop' : undefined,
      category: product.categories?.[0]?.name,
      spec: variant?.title && variant.title !== 'Default' ? variant.title : undefined
    },
    sale: {
      price,
      currency,
      ...(stock ? { stock } : {}),
      availability: stock?.level === 'out-of-stock' ? 'sold' : 'available'
    }
  };
}

export function toSimpleProducts(
  products: HttpTypes.StoreProduct[]
): SimpleProduct[] {
  return products.map((product) => toSimpleProduct(product));
}

type AttributeValue = {
  value?: string | null;
  attribute?: { name?: string | null } | null;
};

export function toProductAttributes(
  product: HttpTypes.StoreProduct
): { label: string; value: string }[] {
  const values = (product as { attribute_values?: AttributeValue[] })
    .attribute_values;

  return (values ?? []).flatMap((row) => {
    const label = row.attribute?.name?.trim();
    const value = row.value?.trim();
    return label && value ? [{ label, value }] : [];
  });
}

export type OfferQuote = {
  id: string;
  seller: string;
  sellerHandle?: string;
  premium: boolean;
  price: number;
  currency: string;
  stock: number;
  variant?: string;
  variantId?: string;
};

export function toOfferQuotes(offers: StoreOffer[]): OfferQuote[] {
  return rankOffers(offers).map((offer) => ({
    id: offer.id,
    seller: offer.seller?.name ?? 'Penjual',
    ...(offer.seller?.handle ? { sellerHandle: offer.seller.handle } : {}),
    premium: Boolean(offer.seller?.is_premium),
    price: getOfferAmount(offer) ?? 0,
    currency: (offer.calculated_price?.currency_code ?? 'idr').toUpperCase(),
    stock: getOfferStock(offer),
    ...(offer.variant_id ? { variantId: offer.variant_id } : {}),
    ...(offer.product_variant?.title &&
    offer.product_variant.title !== 'Default'
      ? { variant: offer.product_variant.title }
      : {})
  }));
}

export type VariantChoice = {
  id: string;
  title: string;
  offerId: string;
  price: number;
  currency: string;
  supply: SupplyStock;
};

export function toVariantChoices(
  variants: HttpTypes.StoreProductVariant[] | null | undefined,
  offers: StoreOffer[]
): VariantChoice[] {
  return (variants ?? []).flatMap((variant) => {
    const winner = getBuyboxWinner(getVariantOffers(offers, variant.id));
    const price = winner ? getOfferAmount(winner) : null;
    if (!winner || price === null) return [];

    return [
      {
        id: variant.id,
        title: variant.title ?? '',
        offerId: winner.id,
        price,
        currency: (
          winner.calculated_price?.currency_code ?? 'idr'
        ).toUpperCase(),
        supply: toSupplyStock(getOfferStock(winner)),
      },
    ];
  });
}

export function toOfferProduct(offer: StoreOffer): SimpleProduct | null {
  const product = offer.product;
  if (!product) return null;

  const count = getOfferStock(offer);

  return {
    kind: 'simple',
    id: product.handle || product.id,
    title: product.title,
    image: product.thumbnail ?? undefined,
    listing: {
      ...(offer.sku ? { ref: offer.sku } : {}),
      ...(offer.seller?.name ? { seller: offer.seller.name } : {}),
      ...(offer.seller ? { sellerKind: 'shop' as const } : {})
    },
    sale: {
      price: getOfferAmount(offer) ?? 0,
      currency: (
        offer.calculated_price?.currency_code ?? 'idr'
      ).toUpperCase(),
      stock: toSupplyStock(count)
    }
  };
}

export function toOfferProducts(offers: StoreOffer[]): SimpleProduct[] {
  return offers
    .map(toOfferProduct)
    .filter((item): item is SimpleProduct => item !== null);
}

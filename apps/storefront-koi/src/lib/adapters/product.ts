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

/** The master product's attributes, as Medusa's `*attribute_values` returns
    them: a value row with its global attribute joined. */
type AttributeValue = {
  value?: string | null;
  attribute?: { name?: string | null } | null;
};

/**
 * A product's `attribute_values` → labelled facts for the spec sheet, in the
 * order the catalog gives them.
 *
 * @remarks
 * The kit's `ListingBase` carries a fixed set of koi facts (bloodline, age,
 * awards) and nothing else, because every one of them has a cell in
 * {@link SpecSheet}. A marketplace's own attributes — a breeder's `jenis`,
 * `ukuran`, `asal` — are arbitrary, so they are rendered as a list beside the
 * sheet rather than forced into it. Empty values are dropped: an attribute the
 * seller never filled in is not a fact.
 */
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

/** One offer, as the comparison panel quotes it. */
export type OfferQuote = {
  id: string;
  /** Who is selling it. */
  seller: string;
  /** Their handle, so the row can link at the breeder's page. */
  sellerHandle?: string;
  /** Whether the house has them on its premium tier. */
  premium: boolean;
  /** The asking price. */
  price: number;
  currency: string;
  /** Units left; `0` means sold out. */
  stock: number;
  /** The variant it is listed on, when the product has more than one. */
  variant?: string;
  /** That variant's id, so a page can narrow the offers to the one the buyer
      picked rather than matching on the display title. */
  variantId?: string;
};

/**
 * Every offer on a product → the rows a buyer compares, in buybox order.
 *
 * @remarks
 * The product page shows the winner's price in its terminal; this is the whole
 * field behind it, because two sellers on one master product is the normal
 * case in a marketplace and a buyer who cannot see the second price cannot
 * decide. Ranked by the same {@link compareOffers} the terminal's price came
 * from, so the first row and the price above them never disagree.
 */
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

/**
 * One buyable variant, as the product page's picker offers it.
 *
 * @remarks
 * The buybox is ranked per variant, not per product: a seller who lists only
 * the 45 cm fish is not undercutting the one who lists the 60 cm, so ranking
 * the whole field would quote a price the picker cannot actually buy. Each
 * entry therefore carries the offer a click on it takes.
 */
export type VariantChoice = {
  id: string;
  title: string;
  /** The offer "Beli sekarang" buys while this variant is picked. */
  offerId: string;
  price: number;
  currency: string;
  /** That offer's units, in the shelf's vocabulary. */
  supply: SupplyStock;
};

/** A product's variants → the pickable ones, in catalog order. A variant no
    offer prices is left out: it is not a choice, it is a hole. */
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

/**
 * One offer → a card, for a feed that is a *seller's* shelf rather than the
 * catalog's.
 *
 * @remarks
 * The seller page cannot go through {@link toSimpleProduct}: that one starts
 * from the master product and asks the buybox which offer speaks for it, and on
 * a breeder's own page the answer must be *this breeder's* offer even when a
 * rival undercuts it. So the offer is the subject here and the product is the
 * joined relation — which is also why `+product.*` is on `OFFER_FIELDS`.
 *
 * An offer with no product joined is dropped by {@link toOfferProducts} rather
 * than rendered titleless.
 */
export function toOfferProduct(offer: StoreOffer): SimpleProduct | null {
  const product = offer.product;
  if (!product) return null;

  const count = getOfferStock(offer);

  return {
    kind: 'simple',
    /* The product's handle, so the card links at the product page the rest of
       the kit links at — a seller page is a way into the catalog, not a
       parallel one. */
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

/** A seller's shelf: every offer that carries a product, in the given order. */
export function toOfferProducts(offers: StoreOffer[]): SimpleProduct[] {
  return offers
    .map(toOfferProduct)
    .filter((item): item is SimpleProduct => item !== null);
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { ROUTES } from '@/const/routes';
import { ProductPage } from '@/components/sections/ProductDetailsPage/components/ProductPage';
import type { MediaItem, ProductPageProps } from '@/types/product-page';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { Availability, SimpleProduct } from '@/types/product';
import type { VariantChoice } from '@/lib/adapters/product';
import { useFeedSearch } from '@/hooks/use-feed-search';
import { addToCart } from '@/lib/data/cart';
import { COUNTRY_CODE } from '@/lib/region';

/**
 * One product, with the rest of the shelf under it paged through the URL.
 *
 * The buy control is the only thing on the page that mutates: it calls the
 * cart's own server action with the offer the buybox picked, because the kit's
 * `onBuy` reports a presentation product and Medusa's cart takes an offer — the
 * two are not derivable from each other (two sellers on one product are two
 * offers), so the winner's id is carried here beside the product.
 *
 * A product with several variants picks *per variant*: the buybox is ranked
 * within the chosen variant's offers, and the terminal behind the picker quotes
 * and buys that variant's winner. The pick lives here, next to the cart call
 * that spends it, so the server page stays a pure read.
 */
export function ProductDetail({
  product,
  shelf,
  media,
  offerId,
  variants,
  account,
  cart,
  ...page
}: {
  product: SimpleProduct;
  shelf: SimpleProduct[];
  media?: MediaItem[];
  offerId?: string;
  variants?: VariantChoice[];
  account?: HeaderAccount;
  cart?: HeaderCart;
} & Pick<
  ProductPageProps,
  | 'description'
  | 'attributes'
  | 'offers'
  | 'offerWinnerId'
  | 'sellerHandle'
  | 'postedAt'
>) {
  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER);
  const router = useRouter();
  const [pending, start] = useTransition();

  /* Only worth a picker with a real choice behind it. */
  const picks = variants && variants.length > 1 ? variants : undefined;
  /* Starts on the variant the product-wide buybox picked, so the price the
     catalog tile quoted is the price the page opens on. */
  const [variantId, setVariantId] = useState(
    () =>
      picks?.find((variant) => variant.offerId === page.offerWinnerId)?.id ??
      picks?.[0]?.id
  );
  const picked = picks?.find((variant) => variant.id === variantId) ?? picks?.[0];
  const onOffer = picked?.offerId ?? offerId;

  const onBuy = () => {
    if (pending) return;

    if (!onOffer) {
      toast.error('Belum ada penjual yang menawarkan produk ini.');
      return;
    }

    start(async () => {
      try {
        await addToCart({ offerId: onOffer, quantity: 1, countryCode: COUNTRY_CODE });
        router.push(ROUTES.cart);
      } catch {
        toast.error('Gagal menambahkan ke keranjang. Coba lagi.');
      }
    });
  };

  return (
    <ProductPage
      product={product}
      shelf={shelf}
      {...page}
      {...(media ? { media } : {})}
      /* The comparison table is the picked variant's field, not every variant's:
         prices for a size the buyer did not choose are not comparable, and the
         reference storefront narrows the same way. */
      {...(picked
        ? {
            offers: (page.offers ?? []).filter(
              (offer) => offer.variantId === picked.id
            )
          }
        : {})}
      {...(picks ? { variants: picks } : {})}
      {...(picked ? { selectedVariantId: picked.id } : {})}
      {...(picks ? { onVariantChange: setVariantId } : {})}
      /* The comparison table tags the row the terminal is quoting — which is
         the picked variant's winner, not the product-wide one. */
      {...(picked ? { offerWinnerId: picked.offerId } : {})}
      onBuy={onBuy}
      account={account}
      cart={cart}
      {...state}
    />
  );
}

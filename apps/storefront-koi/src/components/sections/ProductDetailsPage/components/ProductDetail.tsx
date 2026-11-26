'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { ROUTES } from '@/const/routes';
import { ProductPage } from '@/components/sections/ProductDetailsPage/components/ProductPage';
import type { MediaItem, ProductPageProps } from '@/types/product-page';
import type { Availability, SimpleProduct } from '@/types/product';
import type { VariantChoice } from '@/lib/adapters/product';
import { useFeedSearch } from '@/hooks/use-feed-search';
import { addToCart } from '@/lib/data/cart';
import { COUNTRY_CODE } from '@/lib/region';

export function ProductDetail({
  product,
  shelf,
  media,
  offerId,
  variants,
  ...page
}: {
  product: SimpleProduct;
  shelf: SimpleProduct[];
  media?: MediaItem[];
  offerId?: string;
  variants?: VariantChoice[];
} & Pick<
  ProductPageProps,
  | 'description'
  | 'koi'
  | 'attributes'
  | 'offers'
  | 'offerWinnerId'
  | 'sellerHandle'
  | 'postedAt'
>) {
  // The product page has no attribute facets. Keep the facet selection and the
  // server action handler out of `state`: spread onto the wrapper div they
  // render as `selected="[object Object]"` and an unknown DOM event handler.
  const {
    selected: _selected,
    onAttributesChange: _onAttributesChange,
    ...state
  } = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER);
  const router = useRouter();
  const [pending, start] = useTransition();

  const picks = variants && variants.length > 1 ? variants : undefined;
  const [variantId, setVariantId] = useState(
    () =>
      picks?.find((variant) => variant.offerId === page.offerWinnerId)?.id ??
      picks?.[0]?.id
  );
  const picked = picks?.find((variant) => variant.id === variantId) ?? picks?.[0];
  const onOffer = picked?.offerId ?? offerId;

  const onBuy = (_product: SimpleProduct, quantity: number) => {
    if (pending) return;

    if (!onOffer) {
      toast.error('Belum ada penjual yang menawarkan produk ini.');
      return;
    }

    start(async () => {
      try {
        await addToCart({ offerId: onOffer, quantity, countryCode: COUNTRY_CODE });
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
      {...(picked ? { offerWinnerId: picked.offerId } : {})}
      onBuy={onBuy}
      {...state}
    />
  );
}

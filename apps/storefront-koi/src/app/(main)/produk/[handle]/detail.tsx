'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { DEFAULT_CATALOG_FILTER } from '@/components/constant/catalog';
import { ROUTES } from '@/components/constant/routes';
import { ProductPage } from '@/components/pages/product';
import type { MediaItem } from '@/components/types/product-page';
import type { HeaderAccount, HeaderCart } from '@/components/types/header';
import type { Availability, SimpleProduct } from '@/components/types/product';
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
 */
export function ProductDetail({
  product,
  shelf,
  media,
  offerId,
  account,
  cart
}: {
  product: SimpleProduct;
  shelf: SimpleProduct[];
  media?: MediaItem[];
  offerId?: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER);
  const router = useRouter();
  const [pending, start] = useTransition();

  const onBuy = () => {
    if (pending) return;

    if (!offerId) {
      toast.error('Belum ada penjual yang menawarkan produk ini.');
      return;
    }

    start(async () => {
      try {
        await addToCart({ offerId, quantity: 1, countryCode: COUNTRY_CODE });
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
      {...(media ? { media } : {})}
      onBuy={onBuy}
      account={account}
      cart={cart}
      {...state}
    />
  );
}

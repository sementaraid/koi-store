import { notFound } from 'next/navigation';

import { SHELF_LIMIT } from '@/const';
import { toOfferProducts } from '@/lib/adapters/product';
import { toPartnerProfile } from '@/lib/adapters/seller';
import { listOffers } from '@/lib/data/offers';
import { getSellerByHandle } from '@/lib/data/seller';
import { rankOffers } from '@/lib/helpers/buybox';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { Partner } from './components/Partner';

/** The breeder behind a handle, or nothing. Exported for the route's metadata,
    the same way `getProduct` is. */
export async function getPartner(handle: string) {
  return getSellerByHandle(handle);
}

export async function PartnerPage({
  handle,
  page = 1
}: {
  handle: string;
  page?: number;
}) {
  const [{ account, cart }, seller] = await Promise.all([
    getShell(),
    getPartner(handle)
  ]);

  /* Storefront's own seller page returns `null` here, which renders a blank
     frame with a 200. koi has a `not-found.tsx`, so an unknown or suspended
     breeder gets the 404 it is. */
  if (!seller) notFound();

  const current = Math.max(page, 1);

  /* The seller's own offers, not the catalog's: a breeder's page speaks for
     this breeder's prices even where a rival undercuts them. One offer per
     variant, so a product with several variants returns several rows — ranked
     here and deduped below, keeping the one the buybox would pick.
     ponytail: `count` is the offer count, not the product count, so the pager
     can overshoot by a page on a catalog of multi-variant products. The fix is
     `group_by_seller` on the offers route, which the store route does not
     expose yet. */
  const { offers, count } = await listOffers({
    sellerId: seller.id,
    countryCode: COUNTRY_CODE,
    limit: SHELF_LIMIT,
    offset: (current - 1) * SHELF_LIMIT
  });

  const byProduct = new Map<string, (typeof offers)[number]>();
  for (const offer of rankOffers(offers)) {
    if (!byProduct.has(offer.product_id)) byProduct.set(offer.product_id, offer);
  }

  return (
    <Partner
      partner={toPartnerProfile(seller)}
      shelf={toOfferProducts([...byProduct.values()])}
      total={count}
      page={current}
      pageCount={Math.max(Math.ceil(count / SHELF_LIMIT), 1)}
      handle={seller.handle}
      account={account}
      cart={cart}
    />
  );
}

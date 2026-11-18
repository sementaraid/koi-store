import { notFound } from 'next/navigation';

import { SHELF_LIMIT } from '@/const';
import { toOfferProducts } from '@/lib/adapters/product';
import { toPartnerProfile } from '@/lib/adapters/seller';
import { listOffers } from '@/lib/data/offers';
import { listSellerRatings } from '@/lib/data/ratings';
import { getSellerByHandle } from '@/lib/data/seller';
import { rankOffers } from '@/lib/helpers/buybox';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { Partner } from './components/Partner';

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

  if (!seller) notFound();

  const current = Math.max(page, 1);

  const [{ offers, count }, ratings] = await Promise.all([
    listOffers({
      sellerId: seller.id,
      countryCode: COUNTRY_CODE,
      limit: SHELF_LIMIT,
      offset: (current - 1) * SHELF_LIMIT
    }),
    listSellerRatings(seller.id)
  ]);

  const byProduct = new Map<string, (typeof offers)[number]>();
  for (const offer of rankOffers(offers)) {
    if (!byProduct.has(offer.product_id)) byProduct.set(offer.product_id, offer);
  }

  return (
    <Partner
      partner={toPartnerProfile(seller)}
      ratings={ratings}
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

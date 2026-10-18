'use client';

import { notFound } from 'next/navigation';

import {
  DEFAULT_AUCTION_FILTER,
  DEFAULT_AUCTION_LOTS
} from '@/const/auctions';
import { LotPage } from '@/components/sections/LotDetailsPage/components/LotPage';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { AuctionStatus } from '@/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

/**
 * One lot's dossier, with the floor's grid under it paged through the URL.
 *
 * ponytail: the lot is looked up in the kit's demo floor, so an id outside it
 * is a 404 — which is the right answer either way. Replace the lookup with a
 * loader when `packages/api` has an auction module.
 */
export function LotDossier({
  id,
  account,
  cart
}: {
  id: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const state = useFeedSearch<AuctionStatus>(DEFAULT_AUCTION_FILTER);
  const lot = DEFAULT_AUCTION_LOTS.find((candidate) => candidate.id === id);

  if (!lot) notFound();

  return <LotPage lot={lot} account={account} cart={cart} {...state} />;
}

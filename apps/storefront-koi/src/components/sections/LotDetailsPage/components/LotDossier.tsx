'use client';

import { DEFAULT_AUCTION_FILTER } from '@/const/auctions';
import { LotPage } from '@/components/sections/LotDetailsPage/components/LotPage';
import type { JoinControl } from '@/lib/helpers/join-auction';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { MediaItem } from '@/types/lot';
import type { AuctionProduct, AuctionStatus } from '@/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function LotDossier({
  lot,
  lots,
  media,
  account,
  cart,
  join,
  wonLot
}: {
  lot: AuctionProduct;
  lots: AuctionProduct[];
  media: MediaItem[];
  account?: HeaderAccount;
  cart?: HeaderCart;
  join?: JoinControl;
  wonLot?: {
    id: string;
    status: string;
    hasShippingAddress: boolean;
    claimWindowEndsAt: string | null;
    claim: { status: string; remedy: string; opened_at: string } | null;
    now: number;
  };
}) {
  const { selected: _selected, onAttributesChange: _onAttributesChange, ...state } =
    useFeedSearch<AuctionStatus>(DEFAULT_AUCTION_FILTER);

  return (
    <LotPage
      lot={lot}
      lots={lots}
      media={media}
      account={account}
      cart={cart}
      join={join}
      wonLot={wonLot}
      {...state}
    />
  );
}

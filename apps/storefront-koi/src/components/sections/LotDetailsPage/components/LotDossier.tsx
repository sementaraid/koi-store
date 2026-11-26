'use client';

import { DEFAULT_AUCTION_FILTER } from '@/const/auctions';
import { LotPage } from '@/components/sections/LotDetailsPage/components/LotPage';
import type { WonLotArrivalProof, WonLotPaymentProof } from '@/lib/data/lots';
import type { OwnBid } from '@/lib/helpers/bid-history';
import type { BidStanding } from '@/lib/helpers/bid-status';
import type { JoinControl } from '@/lib/helpers/join-auction';
import type { BidControl } from '@/lib/helpers/place-bid';
import type { MediaItem } from '@/types/lot';
import type { AuctionProduct, AuctionStatus } from '@/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function LotDossier({
  lot,
  lots,
  media,
  join,
  bid,
  position,
  myBidPosition,
  wonLot,
  ownBids,
  referenceNow
}: {
  lot: AuctionProduct;
  lots: AuctionProduct[];
  media: MediaItem[];
  join?: JoinControl;
  bid?: BidControl;
  position?: BidStanding;
  myBidPosition?: 'highest' | 'outbid' | 'won' | 'lost' | 'cancelled';
  ownBids?: OwnBid[];
  referenceNow?: number;
  wonLot?: {
    id: string;
    status: string;
    hasShippingAddress: boolean;
    claimWindowEndsAt: string | null;
    claim: { status: string; remedy: string; opened_at: string } | null;
    finalPrice: number | null;
    payBy: string | null;
    bank: { bank_name: string; bank_account_number: string; bank_account_holder: string } | null;
    proof: WonLotPaymentProof;
    arrivalProof: WonLotArrivalProof;
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
      join={join}
      bid={bid}
      position={position}
      myBidPosition={myBidPosition}
      wonLot={wonLot}
      ownBids={ownBids}
      referenceNow={referenceNow}
      {...state}
    />
  );
}

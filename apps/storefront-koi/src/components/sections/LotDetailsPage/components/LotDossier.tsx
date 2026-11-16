'use client';

import { DEFAULT_AUCTION_FILTER } from '@/const/auctions';
import { LotPage } from '@/components/sections/LotDetailsPage/components/LotPage';
import type { JoinControl } from '@/lib/helpers/join-auction';
import type { BidControl } from '@/lib/helpers/place-bid';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { MediaItem } from '@/types/lot';
import type { AuctionProduct, AuctionStatus } from '@/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

/**
 * One lot's dossier, with the floor's grid under it paged through the URL.
 * The lot and the grid are the server page's own fetch (`getLot`/`listLots`,
 * T-040.2b) — this component only reads the URL's filter and page.
 */
export function LotDossier({
  lot,
  lots,
  media,
  account,
  cart,
  join,
  bid,
  wonLot
}: {
  lot: AuctionProduct;
  lots: AuctionProduct[];
  media: MediaItem[];
  account?: HeaderAccount;
  cart?: HeaderCart;
  /** The join slot's server-side state (US-041); omitted when the lot is not
      open to joins at all. */
  join?: JoinControl;
  /** The bid slot's server-side state (US-042 T-042.3); omitted unless the
      visitor is a joined customer on a live lot. */
  bid?: BidControl;
  /** The winner's own row (US-053 T-053.2); omitted unless they won it. */
  wonLot?: { id: string; status: string };
}) {
  /* `selected`/`onAttributesChange` are `useFeedSearch`'s attribute-facet pair
     — the floor has no facets, so `LotPage` (which takes no such props) must
     not receive them: unused keys here fall into its `...rest` and land on
     the DOM, producing the hydration mismatch and unknown `onAttributesChange`
     warning seen on `/lelang` and the lot dossier. */
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
      bid={bid}
      wonLot={wonLot}
      {...state}
    />
  );
}

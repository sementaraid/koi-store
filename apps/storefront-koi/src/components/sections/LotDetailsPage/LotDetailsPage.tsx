import { notFound } from 'next/navigation';

import { FEED_LIMIT } from '@/const';
import { lotHref } from '@/const/routes';
import { toAuctionProduct, toAuctionProducts } from '@/lib/adapters/lot';
import { getMyFarm } from '@/lib/data/farm';
import { getJoinState, getLot, getWonLot, listLots } from '@/lib/data/lots';
import { getWallet } from '@/lib/data/wallet';
import { joinAvailable, joinControlState, type JoinControl } from '@/lib/helpers/join-auction';
import { bidControlState, type BidControl } from '@/lib/helpers/place-bid';
import { getShell } from '@/lib/shell';
import type { MediaItem } from '@/types/lot';

import { LotDossier } from './components/LotDossier';

/** One lot's dossier: the API's own lot (404 when it is missing or its
    auction is not public, T-040.1), plus the open feed for the grid under
    it. */
export async function LotDetailsPage({ id }: { id: string }) {
  const [{ account, cart }, storeLot, open] = await Promise.all([
    getShell(),
    getLot(id),
    listLots({ limit: FEED_LIMIT })
  ]);

  if (!storeLot) notFound();

  const lot = toAuctionProduct(storeLot);
  const lots = toAuctionProducts(open.lots);
  const media: MediaItem[] = storeLot.photos.map((src) => ({ src, kind: 'image' }));

  const { join, bid } = await getLotControls(storeLot, id);

  /* US-053 T-053.2: only a sold lot has a winner. `getWonLot` returns null for
     a signed-out visitor without calling the authenticated route, and null for
     anyone who did not win — both keep the ordinary public view. */
  const mine = storeLot.sold ? await getWonLot(id) : null;
  const wonLot = mine
    ? {
        id: mine.lot.id,
        status: mine.lot.status,
        hasShippingAddress: mine.has_shipping_address,
        claimWindowEndsAt: mine.lot.claim_window_ends_at,
        claim: mine.lot.claim,
        /* US-054 AC1: the server's clock, so the claim window's copy renders
           identically on both sides of hydration. */
        now: Date.now()
      }
    : undefined;

  return (
    <LotDossier
      lot={lot}
      lots={lots}
      media={media}
      account={account}
      cart={cart}
      join={join}
      bid={bid}
      wonLot={wonLot}
    />
  );
}

/** The lot page's two controls, decided on the server from one set of reads
    (US-041 T-041.2, US-042 T-042.3).

    The join slot: the caller's join answer, their balance, and whether the lot
    is theirs. Owner is matched through the member farm's seller id — the same
    seller the lot names — not a client-side guess; the server's `own_auction`
    still backs it up (AC4).

    The bid slot exists only for a joined, signed-in, non-owner customer on a
    live auction (AC1). Both slots are `undefined` when the lot is not open to
    joins at all (D-048, D-050) — a closed or cancelled lot's band says why. */
async function getLotControls(
  storeLot: NonNullable<Awaited<ReturnType<typeof getLot>>>,
  lotId: string
): Promise<{ join?: JoinControl; bid?: BidControl }> {
  const { auction } = storeLot;
  if (
    !joinAvailable({
      auctionStatus: auction.status,
      cancelled: storeLot.cancelled,
      closed: storeLot.sold !== null
    })
  ) {
    return {};
  }

  const joinState = await getJoinState(auction.id);
  const signedIn = joinState !== null;

  /* Only a signed-in customer has a farm or a balance to read; a signed-out
     visitor gets the sign-in link and needs neither. */
  const [farm, wallet] = signedIn
    ? await Promise.all([getMyFarm().catch(() => null), getWallet(1).catch(() => null)])
    : [null, null];

  const isOwner = !!farm?.id && farm.id === auction.seller?.id;
  const balance = wallet ? wallet.balance : null;
  const joined = joinState?.joined ?? false;

  const bidMode = bidControlState({
    joined: !isOwner && joined,
    auctionStatus: auction.status
  });

  return {
    join: {
      auctionId: auction.id,
      fee: auction.join_fee,
      returnPath: lotHref(lotId),
      balance,
      mode: joinControlState({ signedIn, isOwner, joined })
    },
    bid: bidMode
      ? {
          lotId: storeLot.id,
          ob: storeLot.ob,
          kb: storeLot.kb,
          currentPrice: storeLot.current_price ?? storeLot.ob,
          mode: bidMode
        }
      : undefined
  };
}

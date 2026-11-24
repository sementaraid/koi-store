import { notFound } from 'next/navigation';

import { FEED_LIMIT } from '@/const';
import { lotHref } from '@/const/routes';
import { toAuctionProduct, toAuctionProducts } from '@/lib/adapters/lot';
import { getMyFarm } from '@/lib/data/farm';
import { getJoinState, getLot, getWonLot, listLots, listMyBids } from '@/lib/data/lots';
import { getWallet } from '@/lib/data/wallet';
import { standingForLot } from '@/lib/helpers/bid-status';
import { joinAvailable, joinControlState, type JoinControl } from '@/lib/helpers/join-auction';
import { bidControlState, type BidControl } from '@/lib/helpers/place-bid';
import type { MediaItem } from '@/types/lot';

import { LotDossier } from './components/LotDossier';

export async function LotDetailsPage({ id }: { id: string }) {
  const [storeLot, open, myBids] = await Promise.all([
    getLot(id),
    listLots({ limit: FEED_LIMIT }),
    // Empty for a guest (no request); its own rows read "Anda" in the history.
    listMyBids({ lotId: id })
  ]);

  if (!storeLot) notFound();

  const lot = toAuctionProduct(storeLot);
  const lots = toAuctionProducts(open.lots);
  const media: MediaItem[] = storeLot.photos.map((src) => ({ src, kind: 'image' }));
  const ownBids = myBids.lots[0]?.my_bids;

  const { join, bid } = await getLotControls(storeLot, id);

  // One server clock for the whole page: every countdown, relative time and
  // "Berakhir < 1 jam" chip renders from this value on the server and in the
  // first client paint, so hydration cannot compare two clocks.
  const now = Date.now();

  const mine = storeLot.sold ? await getWonLot(id) : null;
  const wonLot = mine
    ? {
        id: mine.lot.id,
        status: mine.lot.status,
        hasShippingAddress: mine.has_shipping_address,
        claimWindowEndsAt: mine.lot.claim_window_ends_at,
        claim: mine.lot.claim,
        now
      }
    : undefined;

  return (
    <LotDossier
      lot={lot}
      lots={lots}
      media={media}
      join={join}
      bid={bid}
      position={standingForLot(myBids.lots, id)}
      wonLot={wonLot}
      ownBids={ownBids}
      referenceNow={now}
    />
  );
}

export async function getLotControls(
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

  // getMyFarm returns null for "no member session", an expired one or a 401,
  // and throws only after a live member session was sent and the lookup failed
  // (lib/data/farm.ts). A throw therefore means "a farmer whose farm we can't
  // read", never a plain customer, so ownership is unknown, not "not an owner".
  let farmUnknown = false;
  const [farm, wallet] = signedIn
    ? await Promise.all([
        getMyFarm().catch(() => {
          farmUnknown = true;
          return null;
        }),
        getWallet(1).catch(() => null)
      ])
    : [null, null];

  const isOwner = !!farm?.id && farm.id === auction.seller?.id;
  const balance = wallet ? wallet.balance : null;
  const joined = joinState?.joined ?? false;

  const bidMode = bidControlState({
    joined: !isOwner && !farmUnknown && joined,
    auctionStatus: auction.status
  });

  return {
    join: {
      auctionId: auction.id,
      fee: auction.join_fee,
      returnPath: lotHref(lotId),
      balance,
      mode: joinControlState({ signedIn, isOwner, joined, farmUnknown }),
      auctionEnd: auction.end_at
    },
    bid: bidMode ? { lotId: storeLot.id, mode: bidMode } : undefined
  };
}

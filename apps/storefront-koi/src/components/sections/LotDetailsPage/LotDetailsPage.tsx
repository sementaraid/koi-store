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

  const mine = storeLot.sold ? await getWonLot(id) : null;
  const wonLot = mine
    ? {
        id: mine.lot.id,
        status: mine.lot.status,
        hasShippingAddress: mine.has_shipping_address,
        claimWindowEndsAt: mine.lot.claim_window_ends_at,
        claim: mine.lot.claim,
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

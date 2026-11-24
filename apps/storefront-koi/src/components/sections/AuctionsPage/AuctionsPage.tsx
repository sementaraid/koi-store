import { FEED_LIMIT } from '@/const';
import { toAuctionProducts } from '@/lib/adapters/lot';
import { toPositionMap } from '@/lib/adapters/my-bids';
import { listLots, listMyBids } from '@/lib/data/lots';
import { groupUpcoming, tabCounts, type AuctionTab } from '@/lib/helpers/auction-list';
import { getShell } from '@/lib/shell';

import { Auctions, AuctionsLayout } from './components/Auctions';

async function AuctionsList({ tab }: { tab: AuctionTab }) {
  // Live and scheduled are always read: their sizes are the tab counts. Closed
  // lots and the viewer's positions are read only for the tab that shows them.
  const [live, scheduled, closed, myBids] = await Promise.all([
    listLots({ limit: FEED_LIMIT, status: 'live' }),
    listLots({ limit: FEED_LIMIT, status: 'scheduled' }),
    tab === 'ended' ? listLots({ limit: FEED_LIMIT, status: 'closed' }) : null,
    tab === 'live' || tab === 'ended' ? listMyBids() : { lots: [] }
  ]);

  const upcoming = groupUpcoming(scheduled.lots);
  const shown = { live, upcoming: scheduled, ended: closed }[tab];
  const lots = shown && tab !== 'upcoming' ? toAuctionProducts(shown.lots) : [];
  const openLots = toAuctionProducts(live.lots).filter((lot) => lot.auction.status === 'live');

  return (
    <Auctions
      tab={tab}
      counts={tabCounts({
        live: { count: openLots.length, failed: live.failed },
        upcoming,
        upcomingFailed: scheduled.failed
      })}
      failed={shown?.failed}
      lots={lots}
      upcoming={upcoming}
      positions={toPositionMap(myBids.lots)}
      // One clock for every card on this render, so relative time and the
      // "Berakhir < 1 jam" chip match through hydration.
      now={Date.now()}
    />
  );
}

export async function AuctionsPage({ tab }: { tab: AuctionTab }) {
  const { account, cart } = await getShell();

  return (
    <AuctionsLayout account={account} cart={cart}>
      <AuctionsList tab={tab} />
    </AuctionsLayout>
  );
}

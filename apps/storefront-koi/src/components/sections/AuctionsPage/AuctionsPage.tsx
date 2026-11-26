import { FEED_LIMIT } from '@/const';
import { toAuctionProducts } from '@/lib/adapters/lot';
import { toPositionMap } from '@/lib/adapters/my-bids';
import { listLots, listMyBids } from '@/lib/data/lots';
import {
  groupUpcoming,
  hasLotFilters,
  tabCounts,
  TAB_STATUS,
  varietyCounts,
  type AuctionTab,
  type LotFilterState
} from '@/lib/helpers/auction-list';

import { Auctions, AuctionsLayout } from './components/Auctions';

async function AuctionsList({
  tab,
  filters,
  signedIn
}: {
  tab: AuctionTab;
  filters: LotFilterState;
  signedIn: boolean;
}) {
  // US-111 AC6: a guest has no joined lots and the API answers `joined=true`
  // with a 401. Drop the flag from a shared link instead of showing an error.
  const active = signedIn ? filters : { ...filters, joined: undefined };

  // The base lists omit the variety filter so the sidebar counts and tab counts
  // cover every variety, not only the chosen ones. Size, certificate and video
  // narrow the base too: a count beside a checkbox should match that checkbox's
  // effect (US-105 AC5). `joined` narrows them for the same reason.
  const baseFilters = { ...active, variety: [] };
  const hasVariety = active.variety.length > 0;

  // Live and scheduled are always read: their sizes are the tab counts. Closed
  // lots and the viewer's positions are read only for the tab that shows them.
  // A chosen variety costs one extra request for the shown tab.
  const [live, scheduled, closed, myBids, narrowed] = await Promise.all([
    listLots({ limit: FEED_LIMIT, status: 'live', filters: baseFilters }),
    listLots({ limit: FEED_LIMIT, status: 'scheduled', filters: baseFilters }),
    tab === 'ended'
      ? listLots({ limit: FEED_LIMIT, status: 'closed', filters: baseFilters })
      : null,
    tab === 'live' || tab === 'ended' ? listMyBids() : { lots: [] },
    hasVariety
      ? listLots({ limit: FEED_LIMIT, status: TAB_STATUS[tab], filters: active })
      : null
  ]);

  const base = { live, upcoming: scheduled, ended: closed }[tab];
  const shown = narrowed ?? base;
  const lots = shown && tab !== 'upcoming' ? toAuctionProducts(shown.lots) : [];
  const upcomingBase = groupUpcoming(scheduled.lots);
  // On the Akan datang tab the sessions narrow with the filters; the Live tab's
  // preview keeps the next sessions unfiltered.
  const upcoming = tab === 'upcoming' ? groupUpcoming(shown?.lots ?? []) : upcomingBase;
  const openLots = live.lots.filter((lot) => lot.auction.status === 'live');
  const countSource =
    tab === 'live' ? live.lots : tab === 'ended' ? (closed?.lots ?? []) : scheduled.lots;

  return (
    <AuctionsLayout
      tab={tab}
      signedIn={signedIn}
      counts={tabCounts({
        live: { count: openLots.length, failed: live.failed },
        upcoming: upcomingBase,
        upcomingFailed: scheduled.failed
      })}
    >
      <Auctions
        tab={tab}
        failed={shown?.failed}
        lots={lots}
        upcoming={upcoming}
        positions={toPositionMap(myBids.lots)}
        varietyCount={varietyCounts(countSource)}
        filtered={hasLotFilters(active)}
        signedIn={signedIn}
        // One clock for every card on this render, so relative time and the
        // "Berakhir < 1 jam" chip match through hydration.
        now={Date.now()}
      />
    </AuctionsLayout>
  );
}

export function AuctionsPage({
  tab,
  filters,
  signedIn
}: {
  tab: AuctionTab;
  filters: LotFilterState;
  signedIn: boolean;
}) {
  return <AuctionsList tab={tab} filters={filters} signedIn={signedIn} />;
}

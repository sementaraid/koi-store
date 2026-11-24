import { SHELF_LIMIT } from '@/const';
import { toAuctionProduct, toAuctionProducts } from '@/lib/adapters/lot';
import { listLots } from '@/lib/data/lots';
import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { pickHome } from '@/lib/helpers/home-hero';

import { Landing } from './components/Landing';

export async function HomePage() {
  const [{ sellers }, page] = await Promise.all([
    listSellers(6),
    listLots({ limit: SHELF_LIMIT, status: 'live' })
  ]);

  // Only open lots reach the hero and the grid, so a closed lot never gets a bid action.
  // The same clock feeds the cards' relative time through hydration.
  const now = Date.now();
  const { featured, rest, failed } = pickHome(page, now);
  const partners = sellers.length ? sellers.map(toPartnerFarm) : undefined;

  return (
    <Landing
      now={now}
      {...(featured ? { featured: toAuctionProduct(featured) } : {})}
      lots={toAuctionProducts(rest)}
      lotsFailed={failed}
      {...(partners ? { partners } : {})}
    />
  );
}

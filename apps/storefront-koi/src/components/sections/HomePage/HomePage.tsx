import { SHELF_LIMIT } from '@/const';
import { toAuctionProducts } from '@/lib/adapters/lot';
import { listLots } from '@/lib/data/lots';
import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { getShell } from '@/lib/shell';

import { Landing } from './components/Landing';

export async function HomePage() {
  const [{ account }, { sellers }, { lots }] = await Promise.all([
    getShell(),
    listSellers(6),
    listLots({ limit: SHELF_LIMIT })
  ]);

  const products = toAuctionProducts(lots);
  const soonest = lots
    .filter((lot) => !lot.cancelled)
    .reduce<(typeof lots)[number] | undefined>(
      (first, lot) => (!first || lot.end_time < first.end_time ? lot : first),
      undefined
    );
  const featured = products.find((lot) => lot.id === soonest?.id);
  const rest = products.filter((lot) => lot.id !== featured?.id);

  const partners = sellers.length ? sellers.map(toPartnerFarm) : undefined;

  return (
    <Landing
      account={account}
      {...(featured ? { featured } : {})}
      lots={rest}
      {...(partners ? { partners } : {})}
    />
  );
}

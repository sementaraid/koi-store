import { SHELF_LIMIT } from '@/const';
import { toAuctionProducts } from '@/lib/adapters/lot';
import { listLots } from '@/lib/data/lots';
import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { getShell } from '@/lib/shell';

import { Landing } from './components/Landing';

/**
 * The front page.
 *
 * US-040 T-040.2c: the hero and the lot strip read `GET /store/lots` once. The
 * lot closing soonest leads (the route returns the open feed soonest-end
 * first), the rest fill the strip. A cancelled lot stays in the strip — D-050
 * keeps it visible, and the card draws it without a price.
 */
export async function HomePage() {
  /* `HomeProps` takes no `cart` — the landing page's bar carries no cart door,
     which is the kit's own call, not an omission here. */
  const [{ account }, { sellers }, { lots }] = await Promise.all([
    getShell(),
    listSellers(6),
    listLots({ limit: SHELF_LIMIT })
  ]);

  const products = toAuctionProducts(lots);
  /* The hero's CTA is "Pasang Bid": a cancelled lot cannot take one (D-050), so
     it never leads — it stays in the strip. Otherwise the soonest end first. */
  const soonest = lots
    .filter((lot) => !lot.cancelled)
    .reduce<(typeof lots)[number] | undefined>(
      (first, lot) => (!first || lot.end_time < first.end_time ? lot : first),
      undefined
    );
  const featured = products.find((lot) => lot.id === soonest?.id);
  const rest = products.filter((lot) => lot.id !== featured?.id);

  /* Real sellers, not the kit's demo farms: the demo set's hrefs point at
     handles nothing registers, and a visitor who clicks one from the live
     homepage gets a 404. Omitted when the directory is empty, which lets
     `Home` fall back to its own demo band rather than render nothing. */
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

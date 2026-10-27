import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { getShell } from '@/lib/shell';

import { Landing } from './components/Landing';

/**
 * The front page.
 *
 * ponytail: the hero and the lot strip are the kit's demo floor, because no
 * auction module exists in `packages/api` yet (`src/modules` is empty) — there
 * is nothing to list. Swap `featured`/`lots` for a loader the day it lands; the
 * page's props are already that seam.
 */
export async function HomePage() {
  /* `HomeProps` takes no `cart` — the landing page's bar carries no cart door,
     which is the kit's own call, not an omission here. */
  const [{ account }, { sellers }] = await Promise.all([
    getShell(),
    listSellers(6)
  ]);

  /* Real sellers, not the kit's demo farms: the demo set's hrefs point at
     handles nothing registers, and a visitor who clicks one from the live
     homepage gets a 404. Omitted when the directory is empty, which lets
     `Home` fall back to its own demo band rather than render nothing. */
  const partners = sellers.length ? sellers.map(toPartnerFarm) : undefined;

  return <Landing account={account} {...(partners ? { partners } : {})} />;
}

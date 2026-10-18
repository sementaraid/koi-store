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
  const { account } = await getShell();

  return <Landing account={account} />;
}

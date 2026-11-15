import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { getFeeCategories } from '@/lib/data/auctions';
import { getMyFarm } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { farmStatusInfo } from '@/lib/helpers/farm-status';
import { getShell } from '@/lib/shell';
import { ROUTES } from '@/const/routes';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { CreateAuction } from './components/CreateAuction';

/** Create an auction and its lots (US-030 T-030.3).
 *
 * @remarks
 * Gated the same way as the Farmer area home (US-021 AC4, AC5): only a seller
 * whose status is `open` reaches the form. Anyone else — no farm, pending,
 * rejected, suspended — is sent back to the Farmer area home, which already
 * draws the right closed state for each of those. */
export async function CreateAuctionPage() {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.farmAuctionNew),
    getShell(),
    listOrderGroups()
  ]);

  const seller = await getMyFarm().catch((err: unknown) => {
    if (err instanceof ClientError && err.status === 401) {
      redirect(
        `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmAuctionNew)}`
      );
    }
    return null;
  });

  if (!seller || !farmStatusInfo(seller).approved) {
    redirect(ROUTES.farmHome);
  }

  const categories = await getFeeCategories();

  return (
    <CreateAuction
      categories={categories}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}

import { ClientError } from '@mercurjs/client';
import { notFound, redirect } from 'next/navigation';

import { farmAuctionHref, ROUTES } from '@/const/routes';
import { getFeeCategories, getMyAuction } from '@/lib/data/auctions';
import { getMyFarm } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { farmStatusInfo } from '@/lib/helpers/farm-status';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { EditAuction } from './components/EditAuction';

/** Props for {@link EditAuctionPage}. */
export type EditAuctionPageProps = {
  /** The auction's id, from the route segment. */
  id: string;
};

/** Edit a draft auction's own fields (US-030 AC8).
 *
 * @remarks
 * Only a draft is editable. Any other status — already submitted, scheduled
 * or live — shows the auction read-only rather than a form whose submit the
 * server would refuse with a 409; `EditAuction` draws that state.
 *
 * Lots are edited through the add/remove-lot routes, not through `POST
 * /vendor/auctions/:id` (`.strict()`, auction fields only) — `EditAuction`
 * calls `addAuctionLots` / `removeAuctionLot` for those. */
export async function EditAuctionPage({ id }: EditAuctionPageProps) {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(farmAuctionHref(id)),
    getShell(),
    listOrderGroups()
  ]);

  const seller = await getMyFarm().catch((err: unknown) => {
    if (err instanceof ClientError && err.status === 401) {
      redirect(
        `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(
          farmAuctionHref(id)
        )}`
      );
    }
    return null;
  });

  if (!seller || !farmStatusInfo(seller).approved) {
    redirect(ROUTES.farmHome);
  }

  const auction = await getMyAuction(id);
  if (!auction) notFound();

  /* The category picker needs the fee table. A draft's own stored fees still
     show, from the auction itself, even when the table cannot be read. */
  const categories = await getFeeCategories();

  return (
    <EditAuction
      auction={auction}
      categories={categories}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}

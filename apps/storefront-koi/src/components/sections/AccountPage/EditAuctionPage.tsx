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

export type EditAuctionPageProps = {
  id: string;
};

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

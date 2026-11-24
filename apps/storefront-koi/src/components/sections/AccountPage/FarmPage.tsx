import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { getMyFarm } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Farm } from './components/Farm';

export async function FarmPage() {
  const [customer, identity, groups] = await Promise.all([
    requireCustomer(ROUTES.farm),
    getAccountIdentity(),
    listOrderGroups()
  ]);

  let seller = null;
  let failed = false;

  try {
    seller = await getMyFarm();
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farm)}`);
    }
    failed = true;
  }

  return (
    <Farm
      customer={customer}
      seller={seller}
      failed={failed}
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}

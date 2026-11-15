import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { getMyFarm } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Farm } from './components/Farm';

/** The Farmer area's front door (US-020 T-020.3): registration, or its status. */
export async function FarmPage() {
  const [customer, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.farm),
    getShell(),
    listOrderGroups()
  ]);

  let seller = null;
  let failed = false;

  try {
    seller = await getMyFarm();
  } catch (err) {
    /* A member cookie that expired between requests is not "you never
       registered" — the page says it could not read the status. */
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
      account={account}
      cart={cart}
    />
  );
}

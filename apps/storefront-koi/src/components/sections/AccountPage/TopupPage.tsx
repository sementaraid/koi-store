import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import {
  getPlatformBankAccount,
  getTopupRequests,
  type PlatformBankAccount,
  type TopupRequestsPage
} from '@/lib/data/topups';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Topup } from './components/Topup';

const PER_PAGE = 20;

export async function TopupPage() {
  const [, { account, cart }] = await Promise.all([
    requireCustomer(ROUTES.topup),
    getShell()
  ]);
  const groups = await listOrderGroups();

  let requests: TopupRequestsPage;
  let failed = false;

  try {
    requests = await getTopupRequests(PER_PAGE, 0);
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.topup)}`);
    }
    requests = { requests: [], count: 0, limit: PER_PAGE, offset: 0 };
    failed = true;
  }

  let bankAccount: PlatformBankAccount | null;
  try {
    bankAccount = await getPlatformBankAccount();
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.topup)}`);
    }
    bankAccount = null;
  }

  return (
    <Topup
      requests={requests}
      bankAccount={bankAccount}
      failed={failed}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}

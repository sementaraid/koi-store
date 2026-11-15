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

/** How many requests one page of the list shows. */
const PER_PAGE = 20;

/** Top up the wallet with a transfer screenshot (US-011). */
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
    /* Same rule as `WalletPage`: an expired token sends the customer back to
       sign-in, any other failure shows a retry state rather than a false
       "belum pernah top-up". */
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.topup)}`);
    }
    requests = { requests: [], count: 0, limit: PER_PAGE, offset: 0 };
    failed = true;
  }

  /* The bank account is authenticated too (its route requires the customer
     token): a 401 is the same expired-session redirect, and any other failure
     leaves it `null` so the form says the account couldn't be loaded rather
     than showing a blank one. */
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

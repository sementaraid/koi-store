import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { BalanceSync } from '@/components/organisms/AppShell/BalanceSync';
import { ROUTES } from '@/const/routes';
import {
  getPlatformBankAccount,
  getTopupRequests,
  type PlatformBankAccount,
  type TopupRequestsPage
} from '@/lib/data/topups';
import { getWallet } from '@/lib/data/wallet';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Topup } from './components/Topup';

const PER_PAGE = 20;

export async function TopupPage() {
  // The page shows no balance, but the header chip must still be right here
  // (US-107 AC8), so the wallet is read to compare with it.
  const [, identity, wallet] = await Promise.all([
    requireCustomer(ROUTES.topup),
    getAccountIdentity(),
    getWallet(1, 0).catch(() => null)
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
    <>
      <BalanceSync balance={wallet?.balance} />
      <Topup
        requests={requests}
        bankAccount={bankAccount}
        failed={failed}
        openOrders={countOpen(groups)}
        identity={identity}
      />
    </>
  );
}

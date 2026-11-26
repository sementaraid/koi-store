import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { BalanceSync } from '@/components/organisms/AppShell/BalanceSync';
import { ROUTES, saldoTopupHref } from '@/const/routes';
import {
  getPlatformBankAccount,
  getTopupRequests,
  type PlatformBankAccount,
  type TopupRequestsPage
} from '@/lib/data/topups';
import { getWallet, type WalletPage as WalletPageData } from '@/lib/data/wallet';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Topup } from './components/Topup';

// One page of each source, merged into one table. Older rows are out of scope
// until the page grows pagination (US-102 AC9/AC10 do not ask for it).
const HISTORY_LIMIT = 20;

/** `Saldo & top-up`: balance, the numbered top-up steps and one merged history. */
export async function TopupPage({
  initialAmount,
  initialTitle
}: {
  initialAmount?: number;
  initialTitle?: string;
}) {
  const from = saldoTopupHref(initialAmount, initialTitle);
  const [, identity, groups] = await Promise.all([
    requireCustomer(from),
    getAccountIdentity(),
    listOrderGroups()
  ]);

  const rethrowUnauthorized = (err: unknown) => {
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(from)}`);
    }
  };

  let wallet: WalletPageData | null = null;
  try {
    wallet = await getWallet(HISTORY_LIMIT, 0);
  } catch (err) {
    rethrowUnauthorized(err);
  }

  let requests: TopupRequestsPage | null = null;
  try {
    requests = await getTopupRequests(HISTORY_LIMIT, 0);
  } catch (err) {
    rethrowUnauthorized(err);
  }

  let bankAccount: PlatformBankAccount | null = null;
  try {
    bankAccount = await getPlatformBankAccount();
  } catch (err) {
    rethrowUnauthorized(err);
  }

  return (
    <>
      <BalanceSync balance={wallet?.balance} />
      <Topup
        wallet={wallet}
        requests={requests}
        bankAccount={bankAccount}
        openOrders={countOpen(groups)}
        identity={identity}
        initialAmount={initialAmount}
        initialTitle={initialTitle}
      />
    </>
  );
}

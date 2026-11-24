import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { BalanceSync } from '@/components/organisms/AppShell/BalanceSync';
import { ROUTES } from '@/const/routes';
import { getWallet, type WalletPage as WalletPageData } from '@/lib/data/wallet';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Wallet } from './components/Wallet';

const PER_PAGE = 20;

export type WalletPageProps = {
  page?: string | string[];
};

export async function WalletPage({ page: raw }: WalletPageProps) {
  const [, identity, groups] = await Promise.all([
    requireCustomer(ROUTES.wallet),
    getAccountIdentity(),
    listOrderGroups()
  ]);

  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const requested = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);

  let wallet: WalletPageData;
  let failed = false;

  try {
    wallet = await getWallet(PER_PAGE, (requested - 1) * PER_PAGE);
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(
        `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.wallet)}`
      );
    }
    wallet = { balance: 0, transactions: [], count: 0, limit: PER_PAGE, offset: 0 };
    failed = true;
  }

  const pageCount = Math.max(1, Math.ceil(wallet.count / PER_PAGE));
  const page = Math.min(requested, pageCount);

  if (!failed && page !== requested) {
    try {
      wallet = await getWallet(PER_PAGE, (page - 1) * PER_PAGE);
    } catch {
      failed = true;
    }
  }

  return (
    <>
      <BalanceSync balance={failed ? null : wallet.balance} />
      <Wallet
        wallet={wallet}
        failed={failed}
        page={page}
        pageCount={pageCount}
        openOrders={countOpen(groups)}
        identity={identity}
      />
    </>
  );
}

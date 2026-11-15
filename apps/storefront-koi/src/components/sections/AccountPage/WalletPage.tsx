import { ClientError } from '@mercurjs/client';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { getWallet, type WalletPage as WalletPageData } from '@/lib/data/wallet';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Wallet } from './components/Wallet';

/** How many transactions one page of the history shows. */
const PER_PAGE = 20;

/** Props for {@link WalletPage}. */
export type WalletPageProps = {
  /** The `?page=` the route read, unvalidated — clamped here. */
  page?: string | string[];
};

/** Balance and transaction history (US-010). */
export async function WalletPage({ page: raw }: WalletPageProps) {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.wallet),
    getShell(),
    listOrderGroups()
  ]);

  /* A hand-typed `?page=0` or `?page=abc` is a page the customer asked for and
     the list may not have — clamped to 1 rather than sent on to the API as a
     negative offset. The upper bound is clamped after the fetch, once `count`
     is known. */
  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const requested = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);

  let wallet: WalletPageData;
  let failed = false;

  try {
    wallet = await getWallet(PER_PAGE, (requested - 1) * PER_PAGE);
  } catch (err) {
    /* A token that expired between `middleware.ts`'s check and this fetch is
       the one failure that isn't "show an error" — it's the same sign-in
       redirect `requireCustomer()` gives a visitor with no token at all. Any
       other failure (a bad query, the backend being down) must not be read
       as "balance zero": the page shows that it couldn't confirm the
       balance, not a wrong one (see `getWallet`'s own remark). */
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

  /* A hand-typed `?page=` past the end comes back with an empty page from the
     API (offset beyond `count`) — refetched at the clamped page rather than
     shown as a false "no transactions" empty state. Skipped once the first
     fetch already failed — a second doomed round-trip teaches nothing new. */
  if (!failed && page !== requested) {
    try {
      wallet = await getWallet(PER_PAGE, (page - 1) * PER_PAGE);
    } catch {
      failed = true;
    }
  }

  return (
    <Wallet
      wallet={wallet}
      failed={failed}
      page={page}
      pageCount={pageCount}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}

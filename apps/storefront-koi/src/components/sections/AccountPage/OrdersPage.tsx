import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen, Orders } from './components/Orders';

const PER_PAGE = 10;

export type OrdersPageProps = {
  page?: string | string[];
};

export async function OrdersPage({ page: raw }: OrdersPageProps) {
  const [, identity] = await Promise.all([
    requireCustomer(ROUTES.orders),
    getAccountIdentity()
  ]);
  const groups = await listOrderGroups();

  const pageCount = Math.max(1, Math.ceil(groups.length / PER_PAGE));
  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const page = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), pageCount);

  return (
    <Orders
      groups={groups.slice((page - 1) * PER_PAGE, page * PER_PAGE)}
      page={page}
      pageCount={pageCount}
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}

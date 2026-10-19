import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen, Orders } from './components/Orders';

/** How many checkouts one page of the orders list shows. */
const PER_PAGE = 10;

/** Props for {@link OrdersPage}. */
export type OrdersPageProps = {
  /** The `?page=` the route read, unvalidated — clamped here. */
  page?: string | string[];
};

/** Every checkout the customer made, a page at a time. */
export async function OrdersPage({ page: raw }: OrdersPageProps) {
  const [, { account, cart }] = await Promise.all([
    requireCustomer(ROUTES.orders),
    getShell()
  ]);
  const groups = await listOrderGroups();

  const pageCount = Math.max(1, Math.ceil(groups.length / PER_PAGE));
  /* A hand-typed `?page=0`, `?page=abc` or `?page=99` is a page the customer
     asked for and the list does not have — clamped rather than 404'd. */
  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const page = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), pageCount);

  return (
    <Orders
      groups={groups.slice((page - 1) * PER_PAGE, page * PER_PAGE)}
      page={page}
      pageCount={pageCount}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}

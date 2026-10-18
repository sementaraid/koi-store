import { ROUTES } from '@/const/routes';
import { listOrders } from '@/lib/data/orders';
import { requireCustomer } from '@/lib/guard';
import { groupOrders } from '@/lib/helpers/order-groups';
import { getShell } from '@/lib/shell';
import type { AccountOrder } from '@/types/order';

import { AccountHome } from './components/AccountHome';

/**
 * How many per-seller orders the account pages pull in one go.
 *
 * @remarks
 * ponytail: the orders list endpoint returns rows but no count, and grouping
 * collapses several rows into one checkout — so neither the API's offset nor
 * its limit maps to a page of what the customer sees. Fetching one generous
 * page and grouping it is honest for the hundred-or-so orders a koi buyer
 * accumulates; swap for a counted endpoint when someone passes it.
 */
export const ORDER_FETCH_LIMIT = 100;

/** Every checkout the signed-in customer has made, newest first. */
export async function listOrderGroups() {
  const orders = (await listOrders(ORDER_FETCH_LIMIT, 0)) as unknown as AccountOrder[];
  return groupOrders(orders);
}

/** The account's front page: what is owed, what is coming, where it is going. */
export async function AccountPage() {
  const [customer, { account, cart }] = await Promise.all([
    requireCustomer(ROUTES.account),
    getShell()
  ]);
  const groups = await listOrderGroups();

  return (
    <AccountHome
      customer={customer}
      groups={groups}
      account={account}
      cart={cart}
    />
  );
}

import { ROUTES } from '@/const/routes';
import { listOrders } from '@/lib/data/orders';
import { requireCustomer } from '@/lib/guard';
import { groupOrders } from '@/lib/helpers/order-groups';
import type { AccountOrder } from '@/types/order';

import { AccountHome } from './components/AccountHome';

export const ORDER_FETCH_LIMIT = 100;

export async function listOrderGroups() {
  const orders = (await listOrders(ORDER_FETCH_LIMIT, 0)) as unknown as AccountOrder[];
  return groupOrders(orders);
}

export async function AccountPage() {
  const customer = await requireCustomer(ROUTES.account);
  const groups = await listOrderGroups();

  return (
    <AccountHome
      customer={customer}
      groups={groups}
    />
  );
}

import { notFound } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { retrieveOrderGroup } from '@/lib/data/orders';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { OrderDetail, type OrderDetailGroup } from './components/OrderDetail';

/** Props for {@link OrderDetailPage}. */
export type OrderDetailPageProps = {
  /** The order group's id, from the route segment. */
  id: string;
};

/** One checkout, split into the parcel each seller ships. */
export async function OrderDetailPage({ id }: OrderDetailPageProps) {
  const [, { account, cart }] = await Promise.all([
    requireCustomer(`${ROUTES.orders}/${id}`),
    getShell()
  ]);

  /* `retrieveOrderGroup` throws through `medusaError` on a 404 — a stranger's
     order id and a deleted one both land here, and both are "not yours". */
  const group = await retrieveOrderGroup(id).catch(() => null);
  if (!group) notFound();

  return (
    <OrderDetail
      group={group as unknown as OrderDetailGroup}
      account={account}
      cart={cart}
    />
  );
}

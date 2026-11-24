import { notFound } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { retrieveOrderGroup } from '@/lib/data/orders';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { OrderDetail, type OrderDetailGroup } from './components/OrderDetail';

export type OrderDetailPageProps = {
  id: string;
};

export async function OrderDetailPage({ id }: OrderDetailPageProps) {
  const [, identity] = await Promise.all([
    requireCustomer(`${ROUTES.orders}/${id}`),
    getAccountIdentity()
  ]);

  const group = await retrieveOrderGroup(id).catch(() => null);
  if (!group) notFound();

  return (
    <OrderDetail
      group={group as unknown as OrderDetailGroup}
      identity={identity}
    />
  );
}

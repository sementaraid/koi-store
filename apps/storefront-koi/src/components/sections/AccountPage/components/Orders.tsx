import { Package } from 'lucide-react';

import { Button, Card, RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { OrderRow } from '@/components/cells/OrderRow/OrderRow';
import { ROUTES } from '@/const/routes';
import type { OrderGroup } from '@/lib/helpers/order-groups';
import { orderStatus } from '@/lib/helpers/order-status';
import type { AccountIdentity } from './AccountFrame';
import type { AccountOrder } from '@/types/order';

import { AccountFrame } from './AccountFrame';

export type OrdersProps = {
  groups: OrderGroup<AccountOrder>[];
  pageCount: number;
  page: number;
  openOrders: number;
  identity?: AccountIdentity;
};

export function Orders({
  groups,
  pageCount,
  page,
  openOrders,
  identity
}: OrdersProps) {
  return (
    <AccountFrame
      title="Pesanan"
      openOrders={openOrders}
      identity={identity}
    >
      <RenderIf when={groups.length ? groups : null}>
        {(list) => (
          <div>
            <Card className="px-5 py-1">
              {list.map((group) => (
                <OrderRow
                  key={group.id}
                  group={group}
                />
              ))}
            </Card>

            <FeedPagination
              page={page}
              pageCount={pageCount}
              href={ROUTES.orders}
            />
          </div>
        )}
      </RenderIf>

      <RenderIf when={!groups.length}>
        {() => (
          <EmptyFeed
            icon={<Package aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada pesanan"
            noMatchBody="Lot yang Anda menangkan di lelang dan barang yang Anda beli muncul di sini."
            action={
              <Button
                render={<Link href={ROUTES.catalogs} />}
                nativeButton={false}
              >
                Lihat katalog
              </Button>
            }
          />
        )}
      </RenderIf>
    </AccountFrame>
  );
}

export function countOpen(groups: OrderGroup<AccountOrder>[]): number {
  return groups.filter((group) => group.orders.some((order) => orderStatus(order).unpaid))
    .length;
}

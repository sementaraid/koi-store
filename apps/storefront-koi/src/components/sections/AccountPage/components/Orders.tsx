import { Package } from 'lucide-react';

import { Button, Card, RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { OrderRow } from '@/components/cells/OrderRow/OrderRow';
import { ROUTES } from '@/const/routes';
import type { OrderGroup } from '@/lib/helpers/order-groups';
import { orderStatus } from '@/lib/helpers/order-status';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { AccountOrder } from '@/types/order';

import { AccountFrame } from './AccountFrame';

export type OrdersProps = {
  groups: OrderGroup<AccountOrder>[];
  pageCount: number;
  page: number;
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

export function Orders({
  groups,
  pageCount,
  page,
  openOrders,
  account,
  cart
}: OrdersProps) {
  return (
    <AccountFrame
      title="Pesanan"
      eyebrow={
        <>
          <Package
            aria-hidden
            className="size-3.5"
          />
          Transaksi
        </>
      }
      description="Satu baris untuk satu pembayaran. Kiriman dari tiap penjual dipisah di halaman pesanannya."
      openOrders={openOrders}
      account={account}
      cart={cart}
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
            noMatchBody="Koi yang Anda menangkan di lelang dan barang yang Anda beli muncul di sini."
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

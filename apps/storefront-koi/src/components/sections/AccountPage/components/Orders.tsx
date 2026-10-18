import { Package } from 'lucide-react';

import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { OrderRow } from '@/components/cells/OrderRow/OrderRow';
import { ROUTES } from '@/const/routes';
import type { OrderGroup } from '@/lib/helpers/order-groups';
import { orderStatus } from '@/lib/helpers/order-status';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { AccountOrder } from '@/types/order';

import { AccountFrame } from './AccountFrame';

/** Props for {@link Orders}. */
export type OrdersProps = {
  /** The page's own checkouts, already sliced. */
  groups: OrderGroup<AccountOrder>[];
  /** Pages available, so the pager knows whether to draw. */
  pageCount: number;
  /** The page being shown, 1-based. */
  page: number;
  /** Open checkouts across *all* pages — the sidebar's count is about the
      account, not about what this page happens to be showing. */
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * Every checkout the customer has made, newest first.
 *
 * @remarks
 * One row per checkout, not per seller's parcel: a cart holding koi from two
 * farms is paid for once and comes back from the API as two orders, which is
 * the API's bookkeeping and not the customer's. The split is shown on the
 * order's own page, where it means something — each farm ships separately.
 *
 * The pager is anchors, not state: a customer linking their own order history
 * to support, or hitting back, lands on the page they were reading.
 */
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

/** How many of these checkouts the house is still waiting to be paid for. */
export function countOpen(groups: OrderGroup<AccountOrder>[]): number {
  return groups.filter((group) => group.orders.some((order) => orderStatus(order).unpaid))
    .length;
}

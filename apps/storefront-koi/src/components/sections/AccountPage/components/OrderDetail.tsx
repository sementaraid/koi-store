import { Package } from 'lucide-react';

import { Link } from '@/components/atoms/Link/Link';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Card } from '@/components/atoms/Card/Card';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { ROUTES } from '@/const/routes';
import { formatAgo } from '@/lib/helpers/format-ago';
import { formatPrice } from '@/lib/helpers/format-price';
import { orderStatus } from '@/lib/helpers/order-status';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { AccountOrder } from '@/types/order';

import { AccountFrame } from './AccountFrame';

/** One checkout, as `retrieveOrderGroup` returns it. */
export type OrderDetailGroup = {
  id: string;
  display_id?: number | string | null;
  created_at?: string | null;
  total?: number | null;
  orders: AccountOrder[];
};

/** Props for {@link OrderDetail}. */
export type OrderDetailProps = {
  group: OrderDetailGroup;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * One checkout's receipt: every seller's parcel, each with its own status, and
 * the sum the whole thing came to.
 *
 * @remarks
 * Parcels are per-seller because fulfillment is per-seller — one farm can ship
 * while another is still packing, and a customer reading one combined status
 * would not know which fish that status was about.
 */
export function OrderDetail({ group, account, cart }: OrderDetailProps) {
  const currency = group.orders[0]?.currency_code ?? 'IDR';
  const total = group.total ?? group.orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  return (
    <AccountFrame
      title={`Pesanan #${group.display_id ?? group.id}`}
      account={account}
      cart={cart}
    >
      eyebrow={
        <>
          <Package
            aria-hidden
            className="size-3.5"
          />
          Transaksi
        </>
      }
      description={
        <RenderIf when={group.created_at}>
          {(createdAt) => <>Dibuat {formatAgo(createdAt)}</>}
        </RenderIf>
      }
      action={
        <Link
          href={ROUTES.orders}
          className="text-xs font-medium text-accent-ink hover:underline"
        >
          Semua pesanan
        </Link>
      }

      <div className="flex flex-col gap-6">
        {group.orders.map((order) => (
          <Parcel
            key={order.id}
            order={order}
          />
        ))}
      </div>

      <Card className="flex-row items-baseline justify-between gap-4 p-5 [--card-spacing:--spacing(0)]">
        <p className="text-sm font-medium text-muted-foreground">
          Total {group.orders.length > 1 ? `(${group.orders.length} penjual)` : ''}
        </p>
        {/* kit's figure voice: same weight as the cart's total and every order
            row's price. */}
        <p className="font-heading text-xl font-extrabold text-foreground tabular-nums">
          {formatPrice(total, currency)}
        </p>
      </Card>
    </AccountFrame>
  );
}

/** One seller's own order inside the checkout: its items, its status, its own
    subtotal — fulfillment happens per seller, so the status does too. */
function Parcel({ order }: { order: AccountOrder }) {
  const status = orderStatus(order);
  const items = order.items ?? [];

  return (
    <Card
      aria-label={order.seller?.name ? `Kiriman dari ${order.seller.name}` : 'Kiriman'}
      className="[--card-spacing:--spacing(0)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="text-sm font-bold text-foreground">
          {order.seller?.name ?? `Pesanan #${order.display_id ?? order.id}`}
        </p>
        <Badge variant={status.tone}>{status.label}</Badge>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4"
          >
            <RenderIf when={item.thumbnail}>
              {(src) => (
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-[60px] w-[48px] rounded-md object-cover"
                />
              )}
            </RenderIf>
            <RenderIf when={!item.thumbnail}>
              {() => <div className="h-[60px] w-[48px] rounded-md bg-muted" />}
            </RenderIf>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {item.product_title || item.title}
              </p>
              <p className="text-xs text-muted-foreground">{item.quantity ?? 1}x</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-border px-5 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase">Subtotal penjual</p>
        <p className="font-heading text-sm font-extrabold text-foreground tabular-nums">
          {formatPrice(order.total ?? 0, order.currency_code ?? 'IDR')}
        </p>
      </div>
    </Card>
  );
}

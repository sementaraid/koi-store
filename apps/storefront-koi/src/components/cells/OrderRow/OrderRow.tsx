import { ArrowRight } from 'lucide-react';
import { cn } from 'cn';

import { Badge, RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { orderHref } from '@/const/routes';
import { formatAgo } from '@/lib/helpers/format-ago';
import { formatPrice } from '@/lib/helpers/format-price';
import { orderStatus } from '@/lib/helpers/order-status';
import type { OrderGroup } from '@/lib/helpers/order-groups';
import type { AccountOrder } from '@/types/order';

export type OrderRowProps = {
  group: OrderGroup<AccountOrder>;
  className?: string;
};

export function OrderRow({ group, className }: OrderRowProps) {
  const orders = group.orders;
  const first = orders[0];
  const item = first?.items?.[0];
  const status = worstStatus(orders);
  const itemCount = orders.reduce(
    (n, order) => n + (order.items?.length ?? 0),
    0
  );
  const sellers = new Set(orders.map((order) => order.seller?.id ?? order.id))
    .size;

  const title = item?.product_title || item?.title || 'Pesanan';
  const seller = first?.seller?.name;

  return (
    <article
      data-slot="order-row"
      className={cn(
        'flex flex-wrap items-center gap-4 border-b border-border py-4 last:border-b-0',
        className
      )}
    >
      <Link
        href={orderHref(group.id)}
        aria-hidden
        tabIndex={-1}
        className="shrink-0 overflow-hidden rounded-xl"
      >
        <RenderIf when={item?.thumbnail}>
          {(src) => (
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-[60px] w-[48px] object-cover"
            />
          )}
        </RenderIf>
        <RenderIf when={!item?.thumbnail}>
          {() => <div className="h-[60px] w-[48px] bg-muted" />}
        </RenderIf>
      </Link>

      <div className="min-w-[180px] flex-1">
        <Link
          href={orderHref(group.id)}
          className="text-base font-bold text-foreground hover:text-accent-ink"
        >
          {title}
          {itemCount > 1 ? ` +${itemCount - 1} lainnya` : ''}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[
            seller,
            sellers > 1 ? `${sellers} penjual` : undefined,
            group.created_at ? formatAgo(group.created_at) : undefined
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-end">
          <Badge variant={status.tone}>{status.label}</Badge>
          <p className="mt-1 font-heading text-lg font-extrabold text-foreground tabular-nums">
            {formatPrice(group.total, group.currency_code)}
          </p>
        </div>

        <Link
          href={orderHref(group.id)}
          className="flex items-center gap-1 text-2xs font-bold tracking-widest text-accent-ink uppercase hover:underline"
        >
          {status.unpaid ? 'Bayar' : 'Lacak'}
          <ArrowRight
            aria-hidden
            className="size-3.5"
          />
        </Link>
      </div>
    </article>
  );
}

function worstStatus(orders: AccountOrder[]) {
  const statuses = orders.map(orderStatus);
  return (
    statuses.find((status) => status.unpaid) ??
    statuses.find((status) => status.label === 'Diproses') ??
    statuses.find((status) => status.label === 'Dikemas') ??
    statuses.find((status) => status.label === 'Dikirim') ??
    statuses[0]
  );
}

'use client';

import { Link } from '@/components/atoms/Link/Link';
import { LotChip } from '@/components/cells/LotChip/LotChip';
import { lotHref } from '@/const/routes';
import { useCountdown } from '@/hooks/use-countdown';
import type { StoreMyBid } from '@/lib/data/lots';
import { formatPrice } from '@/lib/helpers/format-price';
import {
  formatEndTime,
  formatLotNumber,
  formatTimeLeft,
  viewerPositionChip,
  type ViewerPosition
} from '@/lib/helpers/lot-card';

// One open lot on Bid Saya: whole card links to the lot, so the title link is
// stretched over it and the card is a single tab stop (US-101 AC2).
export function ActiveBidCard({ bid }: { bid: StoreMyBid }) {
  const { lot } = bid;
  const remaining = useCountdown(lot.end_time);
  const position: ViewerPosition =
    bid.position === 'highest'
      ? { kind: 'highest' }
      : { kind: 'outbid', amount: bid.my_highest_bid };
  const title = lot.title ?? formatLotNumber(lot.lot_number);
  const currentPrice = lot.current_price ?? lot.ob;

  return (
    <article className="relative flex flex-col gap-4 rounded-control border border-divider bg-background p-4 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 gap-3">
        {lot.photos[0] ? (
          <img
            src={lot.photos[0]}
            alt={title}
            loading="lazy"
            className="h-16 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div aria-hidden className="h-16 w-20 shrink-0 rounded-xl bg-muted" />
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold">
            <Link
              href={lotHref(lot.id)}
              className="rounded-control after:absolute after:inset-0 after:rounded-control focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
            >
              {title}
            </Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span className="whitespace-nowrap tabular-nums">
              {formatLotNumber(lot.lot_number)}
            </span>
            {lot.auction.seller ? (
              <>
                <span aria-hidden>·</span>
                <span className="min-w-0 truncate">{lot.auction.seller.name}</span>
              </>
            ) : null}
          </p>
          <LotChip
            chip={viewerPositionChip(position, formatPrice)}
            className="mt-1 h-auto min-h-6 max-w-full py-0.5 whitespace-normal"
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:w-64 sm:shrink-0">
        <div>
          <dt className="text-muted-foreground">Bid Anda</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(bid.my_highest_bid)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Harga saat ini</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(currentPrice)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="sr-only">Waktu</dt>
          {/* Reserve the countdown line before it mounts, so the card does not
              grow after hydration and the skeleton swaps without a shift. */}
          <dd className="flex min-h-10 flex-col text-muted-foreground tabular-nums">
            {remaining !== null && remaining > 0 ? (
              <span className="font-semibold text-foreground">{formatTimeLeft(remaining)}</span>
            ) : null}
            <span>Berakhir {formatEndTime(lot.end_time)}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

import { Clock } from 'lucide-react';

import { RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { auctionsTabHref } from '@/const/routes';
import type { CountdownTarget } from '@/hooks/use-countdown';
import { formatPrice } from '@/lib/helpers/format-price';
import { closedPriceLabel, formatEndTime } from '@/lib/helpers/lot-card';

export type LostLotPanelProps = {
  finalPrice: number | null;
  bidCount?: number;
  endTime?: CountdownTarget;
  // The viewer's highest non-removed bid on this lot.
  myBid: number | null;
  joinFee?: number;
  currency?: string;
};

// US-100 AC2 (board 05 state 4): a closed lot the viewer bid on but lost. The
// final price, the viewer's own bid, the end time and the join fee that is not
// refunded. No "dana kembali ke saldo" line, because it never left the balance.
export function LostLotPanel({
  finalPrice,
  bidCount,
  endTime,
  myBid,
  joinFee,
  currency
}: LostLotPanelProps) {
  return (
    <div className="grid gap-2 rounded-md border border-divider bg-surface px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{closedPriceLabel(bidCount)}</p>
        <p className="text-base font-semibold tabular-nums">
          {finalPrice === null ? '—' : formatPrice(finalPrice, currency)}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Bid Anda{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {myBid === null ? '—' : formatPrice(myBid, currency)}
        </span>
      </p>

      <RenderIf when={endTime}>
        {(end) => (
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <Clock aria-hidden className="size-3.5 shrink-0" />
            <span>
              Lelang selesai {formatEndTime(end, { year: true, weekday: 'long' })}
            </span>
          </p>
        )}
      </RenderIf>

      <RenderIf when={joinFee ? joinFee : null}>
        {(fee) => (
          <p className="text-sm text-foreground">
            Biaya ikut {formatPrice(fee, currency)} tidak dikembalikan.
          </p>
        )}
      </RenderIf>

      <Link
        href={auctionsTabHref('live')}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-info-ink underline underline-offset-2"
      >
        Lihat lot lain yang masih dibuka
      </Link>
    </div>
  );
}

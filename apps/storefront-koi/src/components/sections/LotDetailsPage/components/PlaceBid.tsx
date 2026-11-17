'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, FormField, RenderIf } from '@koi/ui';
import { placeBid } from '@/lib/data/lots';
import {
  bidFailureInfo,
  minimumBidLabel,
  minimumNextBid,
  parseBidAmount,
  type BidControl,
  type BidFailure
} from '@/lib/helpers/place-bid';
import { formatPrice } from '@/lib/helpers/format-price';

/**
 * The bid control on a lot's page (US-042 T-042.3, AC1–AC4).
 *
 * @remarks
 * Only a joined customer on a `live` lot sees this; every other state is the
 * join control's to explain (US-041), and the server refuses every bid the
 * client would. The minimum here is a convenience — the server names the real
 * one in `bid_too_low` (D-023).
 *
 * The price shown after a bid comes from the response, never from the amount
 * typed: a bid can still lose to a racing bidder (AC3), so the confirmation
 * says "tercatat", never "menang". When the response carries no
 * `current_price`, the re-read supplies it. A rewritten 409 is keyed on its
 * status and re-reads the lot. No retract control (AC4).
 *
 * Our own accepted bid is a floor, not a ceiling (US-045 fix): the control
 * takes the higher of the price the response reported and the price the page
 * now holds, so a later polled bid still advances the minimum and this line.
 * `useLotPoll` pauses while the customer is typing in `[data-bid-form]`, so
 * the remount the new minimum triggers never wipes an edit in progress.
 *
 * The amount input is keyed to the minimum, so a new minimum (after a bid or
 * a re-read) remounts it prefilled without fighting the customer while they
 * type.
 */
export function PlaceBid({
  lotId,
  ob,
  kb,
  currentPrice,
  mode,
  onEndTime
}: BidControl & { onEndTime?: (endTime: string) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<BidFailure | null>(null);
  /* The server's answer for our own bid: the amount we placed and the price
     it reported (`null` when absent, so the re-read fills it in). */
  const [confirmed, setConfirmed] = useState<{
    amount: number;
    currentPrice: number | null;
  } | null>(null);

  if (mode === 'waiting') {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Bidding dibuka saat lelang dimulai.
      </p>
    );
  }

  /* A closed or cancelled lot draws no control at all — the band above says
     why (D-046, D-050). */
  if (mode !== 'bid') return null;

  /* Our own bid's price and the page's price both move: ours may be behind a
     polled outbid (US-045 fix), and a poll can land before the refresh does.
     The higher is the running price; the board's header reads the same one. */
  const price = Math.max(confirmed?.currentPrice ?? currentPrice, currentPrice);
  const minimum = minimumNextBid({
    ob,
    kb,
    currentPrice: price,
    /* Our own accepted bid means a bid exists, even when it landed on OB. */
    hasBid: confirmed !== null || currentPrice > ob
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = parseBidAmount(String(form.get('amount') ?? ''));

    if (!parsed.ok) {
      setFailure({ message: parsed.error, refresh: false });
      return;
    }

    setBusy(true);
    setFailure(null);
    const result = await placeBid(lotId, parsed.amount);
    setBusy(false);

    if (result.success) {
      toast.success('Bid Anda tercatat. Harga dapat berubah bila ada bid lain.');
      setConfirmed({ amount: parsed.amount, currentPrice: result.current_price ?? null });
      /* The lot's end time after this bid (US-043): a late bid pushes it later,
         so the page's countdown moves now rather than waiting for the refresh. */
      if (result.end_time) onEndTime?.(result.end_time);
      /* Re-read the lot so the board and this control show the server's own
         price. A soft refresh of the server components, not a page reload. */
      router.refresh();
      return;
    }

    const info = bidFailureInfo({
      code: result.code,
      status: result.status,
      message: result.error
    });
    setFailure(info);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3" noValidate data-bid-form>
      <RenderIf when={confirmed}>
        {(bid) => (
          <p className="text-center text-xs text-muted-foreground">
            Bid Anda {formatPrice(bid.amount)} tercatat. Harga sekarang{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatPrice(price)}
            </span>
            .
          </p>
        )}
      </RenderIf>

      <FormField
        key={minimum}
        name="amount"
        label="Jumlah bid (Rp)"
        inputMode="numeric"
        defaultValue={String(minimum)}
        hint={minimumBidLabel(minimum)}
        error={failure?.message}
      />

      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? 'Memproses…' : 'Pasang bid'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Bid tidak dapat ditarik kembali.
      </p>
    </form>
  );
}

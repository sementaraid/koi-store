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
 * The amount input is keyed to the minimum, so a new minimum (after a bid or
 * a re-read) remounts it prefilled without fighting the customer while they
 * type.
 */
export function PlaceBid({ lotId, ob, kb, currentPrice, mode }: BidControl) {
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

  const price = confirmed?.currentPrice ?? currentPrice;
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
    <form onSubmit={submit} className="grid gap-3" noValidate>
      <RenderIf when={confirmed}>
        {(bid) => (
          <p className="text-center text-xs text-muted-foreground">
            Bid Anda {formatPrice(bid.amount)} tercatat
            <RenderIf when={bid.currentPrice}>
              {(now) => (
                <>
                  . Harga sekarang{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatPrice(now)}
                  </span>
                </>
              )}
            </RenderIf>
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

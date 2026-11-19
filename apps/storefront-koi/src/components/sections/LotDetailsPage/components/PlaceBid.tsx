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

  if (mode !== 'bid') return null;

  const price = Math.max(confirmed?.currentPrice ?? currentPrice, currentPrice);
  const minimum = minimumNextBid({
    ob,
    kb,
    currentPrice: price,
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
      if (result.end_time) onEndTime?.(result.end_time);
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

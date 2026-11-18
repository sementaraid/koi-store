'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { markSoldLotPaid } from '@/lib/data/sold-lots';
import { soldLotFailureInfo } from '@/lib/helpers/sold-lot-actions';

/** Props for {@link MarkPaid}. */
export type MarkPaidProps = {
  lotId: string;
};

/**
 * The "Tandai sudah dibayar" action on one `won` sold lot (US-052 T-052.2,
 * AC1, D-058).
 *
 * @remarks
 * The winner pays the farmer directly, off-platform, so nothing moves on the
 * platform when this is pressed: the lot just goes `won → paid`. The status is
 * never flipped here — a success re-reads the server's row, and a refused call
 * either shows the server's Indonesian reason (D-055) or refreshes a stale row
 * (`soldLotFailureInfo`).
 */
export function MarkPaid({ lotId }: MarkPaidProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mark() {
    if (!confirm('Tandai lot ini sudah dibayar? Pemenang sudah membayar langsung ke Anda.')) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await markSoldLotPaid(lotId);
    setBusy(false);

    if (result.success) {
      toast.success('Lot ditandai sudah dibayar.');
      router.refresh();
      return;
    }

    const info = soldLotFailureInfo(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="xs" disabled={busy} onClick={mark}>
        {busy ? 'Memproses…' : 'Tandai sudah dibayar'}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

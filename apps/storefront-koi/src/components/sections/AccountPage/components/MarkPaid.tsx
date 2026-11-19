'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { markSoldLotPaid } from '@/lib/data/sold-lots';
import { soldLotFailureInfo } from '@/lib/helpers/sold-lot-actions';

export type MarkPaidProps = {
  lotId: string;
};

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

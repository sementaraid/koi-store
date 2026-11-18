'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { reportUnpaidLot } from '@/lib/data/sold-lots';
import { unpaidFailureInfo } from '@/lib/helpers/sold-lot-actions';

export type ReportUnpaidProps = {
  lotId: string;
};

export function ReportUnpaid({ lotId }: ReportUnpaidProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function report() {
    if (!confirm('Pemenang belum membayar sampai batas waktu? Laporkan ke admin.')) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await reportUnpaidLot(lotId);
    setBusy(false);

    if (result.success) {
      toast.success('Laporan dikirim.');
      router.refresh();
      return;
    }

    const info = unpaidFailureInfo(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="xs" variant="outline" disabled={busy} onClick={report}>
        {busy ? 'Memproses…' : 'Laporkan belum dibayar'}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

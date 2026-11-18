'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { reportUnpaidLot } from '@/lib/data/sold-lots';
import { unpaidFailureInfo } from '@/lib/helpers/sold-lot-actions';

/** Props for {@link ReportUnpaid}. */
export type ReportUnpaidProps = {
  lotId: string;
};

/**
 * The "Laporkan belum dibayar" action on one overdue `won` sold lot (US-058
 * T-058.2, AC1, D-026, D-058).
 *
 * @remarks
 * The visibility is decided by the row (`canReportUnpaid`, mirrored from the
 * server's `pay_by`); the server stays the real gate. The lot is never changed
 * here — a success re-reads the row, and a refused call either writes the
 * app's own copy for a rewritten 409 (D-055) or keeps the server's Indonesian
 * message.
 */
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

'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button, Label } from '@koi/ui';
import { cancelAuction, cancelLot } from '@/lib/data/live-auctions';
import { cancelAuctionToast } from '@/lib/helpers/live-bid-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

export type CancelActionProps = {
  kind: 'lot' | 'auction';
  id: string;
  onCancelled?: () => void;
};

const COPY = {
  lot: {
    button: 'Batalkan lot',
    confirm:
      'Lot tidak bisa dibuka lagi. Peserta yang sudah ikut tidak otomatis dikembalikan kecuali lelangnya dibatalkan.',
    reasonLabel: 'Alasan pembatalan lot',
    submit: 'Batalkan lot',
    busy: 'Membatalkan…'
  },
  auction: {
    button: 'Batalkan lelang',
    confirm:
      'Semua biaya ikut lelang dikembalikan ke saldo peserta. Biaya pasang lelang tidak dikembalikan. Semua lot yang masih terbuka ikut dibatalkan.',
    reasonLabel: 'Alasan pembatalan lelang',
    submit: 'Batalkan lelang',
    busy: 'Membatalkan…'
  }
} as const;

// US-091 T-091.2 (AC1, AC2, AC3): a written reason plus a confirmation for both
// cancels. D-055: the app shows the backend's 400/404 copy and writes its own
// Indonesian copy for a 409, keyed on status.
export function CancelAction({ kind, id, onCancelled }: CancelActionProps) {
  const uid = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = COPY[kind];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Masukkan alasan pembatalan');
      return;
    }
    if (!confirm(copy.confirm)) return;

    setBusy(true);
    setError(null);

    if (kind === 'lot') {
      const result = await cancelLot(id, reason);
      setBusy(false);
      if (!result.success) {
        refuse(result.error, result.refresh);
        return;
      }
      toast.success('Lot dibatalkan. Lot ini tidak bisa dibuka lagi.');
    } else {
      const result = await cancelAuction(id, reason);
      setBusy(false);
      if (!result.success) {
        refuse(result.error, result.refresh);
        return;
      }
      toast.success(cancelAuctionToast(result.refund, formatRupiah));
    }

    setReason('');
    setOpen(false);
    onCancelled?.();
    router.refresh();
  }

  function refuse(message: string, refresh: boolean) {
    setError(message);
    toast.error(message);
    if (refresh) router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        {copy.button}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-1.5" noValidate>
      <Label htmlFor={`${uid}-reason`}>{copy.reasonLabel}</Label>
      <textarea
        id={`${uid}-reason`}
        rows={2}
        value={reason}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${uid}-error` : undefined}
        onChange={(event) => {
          setReason(event.target.value);
          if (error) setError(null);
        }}
        className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
      />
      {error ? (
        <p id={`${uid}-error`} role="alert" className="text-xs text-destructive-ink">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{copy.confirm}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="destructive" size="xs" disabled={busy}>
          {busy ? copy.busy : copy.submit}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

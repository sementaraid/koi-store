'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, FormField } from '@koi/ui';
import { markSoldLotShipped } from '@/lib/data/sold-lots';
import {
  parseTrackingNumber,
  shipFailureInfo,
  trackingRequired
} from '@/lib/helpers/sold-lot-actions';

/** Props for {@link ShipLot}. */
export type ShipLotProps = {
  lotId: string;
  /** `courier` needs a resi, `self_delivery` does not (AC2). */
  deliveryMethod: string;
};

/**
 * The "Tandai dikirim" action on one `paid` sold lot (US-052 T-052.2).
 *
 * @remarks
 * Only the shift `paid → shipped` exists here; `won` waits for the parked
 * payment step, and every later status shows no action at all. The status is
 * never flipped in this component: a success re-reads the server's row, and a
 * refused call either shows the server's reason or refreshes a stale row
 * (`shipFailureInfo`). The tracking field is required-looking for a courier lot
 * and optional for self-delivery, matching the server's own guard.
 */
export function ShipLot({ lotId, deliveryMethod }: ShipLotProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = parseTrackingNumber(String(form.get('tracking_number') ?? ''), deliveryMethod);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const label = parsed.trackingNumber
      ? `Tandai lot ini dikirim dengan resi ${parsed.trackingNumber}?`
      : 'Tandai lot ini dikirim tanpa nomor resi?';
    if (!confirm(label)) return;

    setBusy(true);
    setError(null);
    const result = await markSoldLotShipped(lotId, parsed.trackingNumber);
    setBusy(false);

    if (result.success) {
      toast.success('Lot ditandai dikirim.');
      setOpen(false);
      router.refresh();
      return;
    }

    const info = shipFailureInfo(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
          Tandai dikirim
        </Button>
        {error ? (
          <span role="alert" className="text-xs text-destructive-ink">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  const required = trackingRequired(deliveryMethod);

  return (
    <form onSubmit={submit} className="grid max-w-sm gap-2" noValidate>
      <FormField
        name="tracking_number"
        label={required ? 'Nomor resi' : 'Nomor resi (opsional)'}
        inputMode="text"
        maxLength={100}
        placeholder={required ? 'Contoh: JNE123' : 'Kosongkan bila diantar sendiri'}
        error={error ?? undefined}
        hint={
          required
            ? 'Wajib diisi untuk pengiriman kurir.'
            : 'Pengantaran sendiri tidak memerlukan resi.'
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="xs" disabled={busy}>
          {busy ? 'Memproses…' : 'Konfirmasi dikirim'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

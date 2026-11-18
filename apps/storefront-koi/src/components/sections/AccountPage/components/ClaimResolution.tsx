'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { resolveClaim } from '@/lib/data/claims';
import { claimResolutionFailure } from '@/lib/helpers/farm-claim';

/** Props for {@link ClaimResolution}. */
export type ClaimResolutionProps = {
  claimId: string;
  /** `refund` or `replacement`; names what the farmer already did (AC1). */
  remedy: string;
};

/**
 * The farmer marks an `approved` claim done (US-056 T-056.2a, AC1, D-038).
 *
 * @remarks
 * The refund or the replacement happened off-platform (D-058), so this only
 * moves the claim `approved → resolved`; no amount is named. The status is
 * never flipped here — a success re-reads the server's row, and a refused call
 * either shows the server's Indonesian reason or refreshes a stale row
 * (`claimResolutionFailure`).
 */
export function ClaimResolution({ claimId, remedy }: ClaimResolutionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = remedy === 'replacement' ? 'mengirim ikan pengganti' : 'mengembalikan dana';

  async function resolve() {
    if (
      !confirm(
        `Sudah ${done}? Klaim akan ditutup dan pemenang mengonfirmasi.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await resolveClaim(claimId);
    setBusy(false);

    if (result.success) {
      toast.success('Klaim ditandai selesai. Menunggu konfirmasi pemenang.');
      router.refresh();
      return;
    }

    const info = claimResolutionFailure(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="mt-2 grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="xs" disabled={busy} onClick={resolve}>
          {busy ? 'Memproses…' : 'Tandai klaim selesai'}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

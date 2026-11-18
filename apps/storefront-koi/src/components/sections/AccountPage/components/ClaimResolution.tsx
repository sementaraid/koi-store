'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { resolveClaim } from '@/lib/data/claims';
import { claimResolutionFailure } from '@/lib/helpers/farm-claim';

export type ClaimResolutionProps = {
  claimId: string;
  remedy: string;
};

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

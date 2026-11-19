'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { confirmClaim } from '@/lib/data/lots';
import { claimConfirmFailure } from '@/lib/helpers/claim';

export type ConfirmClaimProps = {
  lotId: string;
};

export function ConfirmClaim({ lotId }: ConfirmClaimProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDone() {
    if (
      !confirm(
        'Peternak sudah mengembalikan dana atau mengirim ikan pengganti? Klaim akan ditutup.'
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await confirmClaim(lotId);
    setBusy(false);

    if (result.success) {
      toast.success('Klaim dikonfirmasi selesai.');
      router.refresh();
      return;
    }

    const info = claimConfirmFailure(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="grid justify-end gap-1">
      <Button type="button" size="xs" disabled={busy} onClick={confirmDone}>
        {busy ? 'Memproses…' : 'Konfirmasi klaim selesai'}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

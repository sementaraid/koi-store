'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { acceptClaim, disputeClaim } from '@/lib/data/claims';
import { remedyLabel } from '@/lib/helpers/claim';
import { claimDecisionFailure } from '@/lib/helpers/farm-claim';

export type ClaimDecisionProps = {
  claimId: string;
  remedy: string;
};

export function ClaimDecision({ claimId, remedy }: ClaimDecisionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remedyName = remedyLabel(remedy).toLowerCase();

  async function decide(decision: 'accept' | 'dispute') {
    const label =
      decision === 'accept'
        ? `Setujui klaim dengan ${remedyName}? Pemenang akan dihubungi untuk penyelesaian.`
        : `Ajukan sengketa dengan ${remedyName}? Admin akan meninjau klaim ini.`;
    if (!confirm(label)) return;

    setBusy(true);
    setError(null);
    const result = decision === 'accept' ? await acceptClaim(claimId) : await disputeClaim(claimId);
    setBusy(false);

    if (result.success) {
      toast.success(decision === 'accept' ? 'Klaim disetujui.' : 'Sengketa diajukan.');
      router.refresh();
      return;
    }

    const info = claimDecisionFailure(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="mt-2 grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="xs" disabled={busy} onClick={() => decide('accept')}>
          Setujui klaim
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={busy}
          onClick={() => decide('dispute')}
        >
          Ajukan sengketa
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

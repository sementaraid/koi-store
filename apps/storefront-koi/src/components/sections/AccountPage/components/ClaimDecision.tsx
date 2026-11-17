'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { acceptClaim, disputeClaim } from '@/lib/data/claims';
import { remedyLabel } from '@/lib/helpers/claim';
import { claimDecisionFailure } from '@/lib/helpers/farm-claim';

/** Props for {@link ClaimDecision}. */
export type ClaimDecisionProps = {
  claimId: string;
  /** `refund` or `replacement`; named in the confirm copy (AC1). */
  remedy: string;
};

/**
 * The farmer's two answers to an `open` claim (US-055 T-055.2, AC1, D-038).
 *
 * @remarks
 * Accept moves the claim straight to `approved` with no admin step; dispute
 * moves it to `disputed` for the admin. Only `open` renders this component —
 * every other status keeps the read-only block. The status is never flipped
 * here: a success re-reads the server's row, and a refused call either shows
 * the server's reason or refreshes a stale row (`claimDecisionFailure`).
 */
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

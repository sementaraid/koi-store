'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, RenderIf } from '@koi/ui';
import { markWonLotDelivered } from '@/lib/data/lots';
import {
  deliverFailureInfo,
  wonLotAction,
  wonLotStatusLabel
} from '@/lib/helpers/won-lot';

/** Props for {@link WonLotPanel}: the winner's own row (US-053 T-053.2). */
export type WonLotPanelProps = {
  lotId: string;
  status: string;
};

/**
 * The winner's own band on a won lot's page (US-053 T-053.2, AC1).
 *
 * @remarks
 * Only the winner's row reaches here: the page asks `GET /store/won-lots/:id`
 * for a signed-in customer, and a 404 (not the winner) keeps the ordinary
 * public view. A `shipped` lot gets "Tandai sudah diterima" behind a confirm;
 * every other won-and-later status gets its own line and no action — payment
 * is not built in this release (T-052.4 parked). A success re-reads the
 * server's row (`router.refresh()`), a stale 409 refreshes the same way, and
 * no payment copy is added (the paid state is escrow's to fill in later).
 */
export function WonLotPanel({ lotId, status }: WonLotPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = wonLotStatusLabel(status);
  const action = wonLotAction(status);

  async function deliver() {
    if (!confirm('Tandai ikan ini sudah Anda terima?')) return;

    setBusy(true);
    setError(null);
    const result = await markWonLotDelivered(lotId);
    setBusy(false);

    if (result.success) {
      toast.success('Lot ditandai sudah diterima.');
      router.refresh();
      return;
    }

    const info = deliverFailureInfo(result);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  if (!label && !action) return null;

  return (
    <div className="grid gap-2 rounded-md border border-info/40 bg-muted/40 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Lot Anda menangkan</p>
        <RenderIf when={label}>
          {(text) => <Badge variant="info">{text}</Badge>}
        </RenderIf>
      </div>

      <RenderIf when={action === 'deliver'}>
        {() => (
          <>
            <p className="text-xs text-muted-foreground">
              Setelah ikan Anda terima, tandai di sini. Penjual melihat lot ini selesai.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={deliver} disabled={busy}>
                {busy ? 'Memproses…' : 'Tandai sudah diterima'}
              </Button>
              {error ? (
                <span role="alert" className="text-xs text-destructive-ink">
                  {error}
                </span>
              ) : null}
            </div>
          </>
        )}
      </RenderIf>
    </div>
  );
}

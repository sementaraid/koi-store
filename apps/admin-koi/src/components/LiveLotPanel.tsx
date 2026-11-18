'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Label } from '@koi/ui';
import { removeBid, type AdminLiveLotBid, type AdminLiveLotDetail } from '@/lib/data/live-auctions';
import { formatAuctionDate } from '@/lib/helpers/auction-format';
import {
  bidFailureInfo,
  bidReasonError,
  canRemoveBid,
  lotStatusLabel,
  lotStatusTone,
  sourceLabel,
  timeLeftLabel
} from '@/lib/helpers/live-bid-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

/** Props for {@link LiveLotPanel}. */
export type LiveLotPanelProps = {
  /** The lot header and every bid, removed rows included (T-072.1b). */
  detail: AdminLiveLotDetail;
  /** The server's clock, so the countdown reads the same on both renders. */
  now: string;
};

const CONFIRM_COPY =
  'Bid akan ditandai dihapus, tidak dihapus permanen. Harga berjalan dihitung ulang.';

/**
 * The bid panel for one lot on `/lelang/langsung` (US-072 T-072.2b).
 *
 * @remarks
 * A punishing action, so it asks twice: a written reason checked on the client,
 * then a confirm dialog naming the consequence. The lot's `current_price` after
 * the removal comes from the server's answer and is shown in the toast; the
 * panel re-reads through `router.refresh()`. Removal is offered only while the
 * lot is `open` — a closed lot renders read-only with the audit still visible.
 *
 * Names and opaque ids only; no phone, email or address reaches this page
 * (D-042/D-052).
 */
export function LiveLotPanel({ detail, now }: LiveLotPanelProps) {
  const { lot, bids } = detail;
  const open = lot.status === 'open';

  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium">Lot {lot.id}</h2>
          <Badge variant={lotStatusTone(lot.status)}>{lotStatusLabel(lot.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)} · Harga berjalan{' '}
          <span className="font-medium text-foreground">{formatRupiah(lot.current_price)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Berakhir {formatAuctionDate(lot.end_time)} · {timeLeftLabel(lot.end_time, now)}
        </p>
        {lot.cancel_reason ? (
          <p className="text-sm text-muted-foreground">Alasan batal: {lot.cancel_reason}</p>
        ) : null}
      </div>

      {open ? null : (
        <p className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
          Lot ini tidak sedang terbuka, jadi bid tidak bisa dihapus. Daftar bid tetap ditampilkan
          sebagai riwayat.
        </p>
      )}

      {bids.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada bid di lot ini.</p>
      ) : (
        <div className="grid gap-2">
          {bids.map((bid) => (
            <BidRow key={bid.id} bid={bid} lotStatus={lot.status} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One bid. A removed row keeps its place and shows the reason (AC2). */
function BidRow({ bid, lotStatus }: { bid: AdminLiveLotBid; lotStatus: string }) {
  const id = useId();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const removed = bid.removed_at !== null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = bidReasonError(reason);
    if (message) {
      setError(message);
      return;
    }
    if (!confirm(CONFIRM_COPY)) return;

    setBusy(true);
    setError(null);
    const result = await removeBid(bid.id, reason);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      if (result.refresh) router.refresh();
      return;
    }

    toast.success(`Bid dihapus. Harga berjalan sekarang ${formatRupiah(result.lot.current_price)}.`);
    setReason('');
    setFormOpen(false);
    router.refresh();
  }

  return (
    <div className="grid gap-1 rounded-md border border-border p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{bid.bidder.name || '—'}</span>
        <span className="text-muted-foreground">{bid.bidder.customer_id}</span>
        <Badge variant={removed ? 'muted' : 'info'}>{sourceLabel(bid.source)}</Badge>
        {removed ? <Badge variant="urgent">Dihapus</Badge> : null}
      </div>
      <p>
        <span className="font-medium">{formatRupiah(bid.amount)}</span>{' '}
        <span className="text-muted-foreground">{formatAuctionDate(bid.created_at)}</span>
      </p>
      {removed ? (
        <p className="text-xs text-muted-foreground">
          Alasan penghapusan: {bid.removed_reason || '—'}
        </p>
      ) : null}

      {canRemoveBid(bid, lotStatus) ? (
        formOpen ? (
          <form onSubmit={submit} className="grid gap-1.5" noValidate>
            <Label htmlFor={`${id}-reason`}>Alasan penghapusan</Label>
            <textarea
              id={`${id}-reason`}
              rows={2}
              value={reason}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{CONFIRM_COPY}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="destructive" size="xs" disabled={busy}>
                {busy ? 'Menghapus…' : 'Hapus bid'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={busy}
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <Button type="button" variant="outline" size="xs" onClick={() => setFormOpen(true)}>
              Hapus bid
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { cancelAuction, type AuctionDetail } from '@/lib/data/auctions';
import { cancelFailureInfo, cancelSuccessMessage } from '@/lib/helpers/auction-cancel';

/** Props for {@link CancelAuctionButton}. */
export type CancelAuctionButtonProps = {
  auctionId: string;
  /** The server's read-back, so the screen shows `cancelled` at once. */
  onSuccess?: (auction: AuctionDetail) => void;
};

/** Confirmation copy: both money facts, plainly (AC1, AC2, D-058's sale scope).
 *  No number for the refund — the API only reports it after the cancel. */
const CONFIRM_COPY =
  'Batalkan lelang ini? Semua biaya ikut lelang setiap peserta dikembalikan ke saldo mereka. Biaya pasang lelang tidak dikembalikan.';

/** "Batalkan lelang" (US-060 T-060.2, AC3).
 *
 * @remarks
 * Only rendered while the auction is `draft`, `pending_approval` or
 * `scheduled`; `EditAuction` hides it past that. The status is never flipped
 * here: the refund figures and the new status come from the server, and the
 * page re-reads the auction after the call. A 409 means the screen went stale
 * (someone started it), so the copy says so and the page refreshes. */
export function CancelAuctionButton({ auctionId, onSuccess }: CancelAuctionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (busy || !confirm(CONFIRM_COPY)) return;

    setBusy(true);
    const result = await cancelAuction(auctionId);
    setBusy(false);

    if (!result.success) {
      const info = cancelFailureInfo({ ...result, message: result.error });
      toast.error(info.message);
      if (info.refresh) router.refresh();
      return;
    }

    onSuccess?.(result.data);
    toast.success(cancelSuccessMessage(result.refund));
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={cancel}
    >
      {busy ? 'Membatalkan…' : 'Batalkan lelang'}
    </Button>
  );
}

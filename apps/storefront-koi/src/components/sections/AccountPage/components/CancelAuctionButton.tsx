'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { cancelAuction, type AuctionDetail } from '@/lib/data/auctions';
import { cancelFailureInfo, cancelSuccessMessage } from '@/lib/helpers/auction-cancel';

export type CancelAuctionButtonProps = {
  auctionId: string;
  onSuccess?: (auction: AuctionDetail) => void;
};

const CONFIRM_COPY =
  'Batalkan lelang ini? Semua biaya ikut lelang setiap peserta dikembalikan ke saldo mereka. Biaya pasang lelang tidak dikembalikan.';

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

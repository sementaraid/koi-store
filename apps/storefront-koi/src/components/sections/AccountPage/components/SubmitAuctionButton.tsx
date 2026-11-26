'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { submitAuction, type AuctionDetail } from '@/lib/data/auctions';
import { submitFailureInfo, type SubmitFailure } from '@/lib/helpers/auction-submit';

export type SubmitAuctionButtonProps = {
  auctionId: string;
  prepare?: () => Promise<boolean>;
  onSuccess?: (auction: AuctionDetail) => void;
};

export function SubmitAuctionButton({
  auctionId,
  prepare,
  onSuccess
}: SubmitAuctionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SubmitFailure | null>(null);

  async function submit() {
    if (prepare && !(await prepare())) return;

    setBusy(true);
    setFailure(null);
    const result = await submitAuction(auctionId);
    setBusy(false);

    if (!result.success) {
      const info = submitFailureInfo(result.code, result.error);
      setFailure(info);
      if (!info.topUp) toast.error(info.message);
      return;
    }

    toast.success('Lelang dikirim untuk persetujuan.');
    onSuccess?.(result.data);
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <RenderIf when={failure?.topUp ? failure : null}>
        {(info) => (
          <div className="grid gap-2 rounded-md border border-destructive-ink/30 bg-muted px-3 py-2">
            <p className="text-sm font-medium text-foreground">{info.message}</p>
            <p className="text-xs text-muted-foreground">
              Saldo Anda belum cukup untuk biaya pasang lelang ini. Lakukan top-up dulu, lalu
              kembali ke sini dan kirim ulang lelang. Tidak ada yang berubah pada lelang ini.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href={ROUTES.saldoTopup} />}
                nativeButton={false}
              >
                Top-up saldo
              </Button>
              <Button
                variant="outline"
                render={<Link href={ROUTES.saldoTopup} />}
                nativeButton={false}
              >
                Lihat saldo
              </Button>
            </div>
          </div>
        )}
      </RenderIf>

      <RenderIf when={!failure?.topUp}>
        {() => (
          <div>
            <Button
              type="button"
              disabled={busy}
              onClick={submit}
            >
              {busy ? 'Mengirim…' : 'Kirim untuk persetujuan'}
            </Button>
          </div>
        )}
      </RenderIf>
    </div>
  );
}

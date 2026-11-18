'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { joinAuction } from '@/lib/data/lots';
import {
  joinFailureInfo,
  joinFeeLabel,
  type JoinControl,
  type JoinFailure
} from '@/lib/helpers/join-auction';
import { formatPrice } from '@/lib/helpers/format-price';

export function JoinAuction({ auctionId, fee, returnPath, balance, mode }: JoinControl) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<JoinFailure | null>(null);

  if (mode === 'signed-out') {
    return (
      <Button
        size="lg"
        variant="outline"
        render={
          <Link
            href={`${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(returnPath)}`}
          />
        }
        nativeButton={false}
        className="w-full"
      >
        Masuk untuk ikut lelang
      </Button>
    );
  }

  if (mode === 'owner') {
    return null;
  }

  if (mode === 'joined') {
    return (
      <div className="grid gap-1 text-center">
        <Badge variant="muted" className="mx-auto">
          Sudah ikut
        </Badge>
        <p className="text-xs text-muted-foreground">Anda terdaftar sebagai peserta lelang ini.</p>
      </div>
    );
  }

  async function join() {
    const parts = [fee > 0 ? `Biaya ikut lelang ${formatPrice(fee)}` : 'Ikut lelang ini tanpa biaya'];
    if (balance !== null) parts.push(`saldo Anda ${formatPrice(balance)}`);
    if (!confirm(`${parts.join(', ')}. Lanjutkan?`)) return;

    setBusy(true);
    setFailure(null);
    const result = await joinAuction(auctionId);
    setBusy(false);

    if (result.success) {
      toast.success('Berhasil ikut lelang.');
      router.refresh();
      return;
    }

    const info = joinFailureInfo({
      code: result.code,
      status: result.status,
      message: result.error,
      fee
    });
    setFailure(info);
    if (!info.topUp) toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <div className="grid gap-3">
      <RenderIf when={failure?.topUp ? failure : null}>
        {(info) => (
          <div className="grid gap-2 rounded-md border border-destructive-ink/30 bg-muted px-3 py-2">
            <p className="text-sm font-medium text-foreground">{info.message}</p>
            <p className="text-xs text-muted-foreground">
              Lakukan top-up dulu, lalu kembali ke sini dan ikut lagi. Belum ada biaya yang diambil.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button render={<Link href={ROUTES.topup} />} nativeButton={false}>
                Top-up saldo
              </Button>
              <Button variant="outline" render={<Link href={ROUTES.wallet} />} nativeButton={false}>
                Lihat saldo
              </Button>
            </div>
          </div>
        )}
      </RenderIf>

      <RenderIf when={!failure?.topUp}>
        {() => (
          <Button type="button" size="lg" variant="outline" disabled={busy} onClick={join} className="w-full">
            {busy ? 'Memproses…' : joinFeeLabel(fee)}
          </Button>
        )}
      </RenderIf>
    </div>
  );
}

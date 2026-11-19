'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge, Button, FormField, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { markWonLotDelivered, openClaim } from '@/lib/data/lots';
import {
  claimFailureInfo,
  claimStatusLabel,
  claimWindowInfo,
  CLAIM_VIDEO_MAX_BYTES,
  remedyLabel
} from '@/lib/helpers/claim';
import {
  deliverFailureInfo,
  wonLotAction,
  wonLotStatusLabel
} from '@/lib/helpers/won-lot';

export type WonLotPanelProps = {
  lotId: string;
  status: string;
  hasShippingAddress: boolean;
  claimWindowEndsAt: string | null;
  claim: { status: string; remedy: string; opened_at: string } | null;
  now: number;
};

function RemedyOption({
  value,
  current,
  label
}: {
  value: 'refund' | 'replacement';
  current: 'refund' | 'replacement';
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="radio"
        name="remedy"
        value={value}
        defaultChecked={current === value}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

export function WonLotPanel({
  lotId,
  status,
  hasShippingAddress,
  claimWindowEndsAt,
  claim,
  now
}: WonLotPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const label = wonLotStatusLabel(status);
  const action = wonLotAction(status);
  const window = claimWindowInfo(claimWindowEndsAt, now);
  const showClaimForm = status === 'delivered' && !claim && window.open;

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

  function onFileChange(files: FileList | null) {
    const file = files?.[0];
    setFileWarning(
      file && file.size > CLAIM_VIDEO_MAX_BYTES
        ? 'Ukuran video maksimal 100 MB. Pilih video yang lebih kecil.'
        : null
    );
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const video = form.get('video');
    const remedy = form.get('remedy');

    if (!(video instanceof File) || video.size === 0) {
      setError('Video unboxing wajib diunggah.');
      return;
    }
    if (video.size > CLAIM_VIDEO_MAX_BYTES) {
      setError('Ukuran video maksimal 100 MB. Pilih video yang lebih kecil.');
      return;
    }
    if (remedy !== 'refund' && remedy !== 'replacement') {
      setError('Pilih pengembalian dana atau ikan pengganti.');
      return;
    }

    setBusy(true);
    setError(null);
    const result = await openClaim(lotId, remedy, video);
    setBusy(false);

    if (result.success) {
      toast.success('Klaim diajukan.');
      router.refresh();
      return;
    }

    const info = claimFailureInfo(result);
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

      <RenderIf when={!hasShippingAddress}>
        {() => (
          <p className="text-xs text-foreground">
            Tambahkan alamat pengiriman utama agar peternak bisa mengirim ikanmu.{' '}
            <Link href={ROUTES.addresses} className="font-medium underline">
              Tambah alamat
            </Link>
          </p>
        )}
      </RenderIf>

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

      <RenderIf when={status === 'delivered' && claim ? claim : null}>
        {(mine) => (
          <p className="text-xs text-foreground">
            Klaim diajukan — status: {claimStatusLabel(mine.status)}. Pilihan:{' '}
            {remedyLabel(mine.remedy)}.
          </p>
        )}
      </RenderIf>

      <RenderIf when={status === 'delivered' && !claim && !window.open ? window.label : null}>
        {(text) => <p className="text-xs text-muted-foreground">{text}</p>}
      </RenderIf>

      <RenderIf when={showClaimForm}>
        {() => (
          <form onSubmit={submitClaim} className="grid gap-2" noValidate>
            <p className="text-xs text-muted-foreground">
              Ikan mati atau sakit saat diterima? Ajukan klaim dengan video unboxing.
              {window.label ? ` ${window.label}.` : ''}
            </p>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-medium">Pilihan penyelesaian</legend>
              <RemedyOption value="refund" current="refund" label="Pengembalian dana" />
              <RemedyOption value="replacement" current="replacement" label="Ikan pengganti" />
            </fieldset>

            <FormField
              label="Video unboxing"
              type="file"
              name="video"
              accept="video/mp4,video/webm,video/quicktime"
              hint="MP4, WebM, atau QuickTime. Maksimal 100 MB."
              error={fileWarning ?? undefined}
              onChange={(e) => onFileChange(e.target.files)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? 'Mengirim…' : 'Ajukan klaim'}
              </Button>
              {error ? (
                <span role="alert" className="text-xs text-destructive-ink">
                  {error}
                </span>
              ) : null}
            </div>
          </form>
        )}
      </RenderIf>
    </div>
  );
}

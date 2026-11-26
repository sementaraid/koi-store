'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, Button, FormField, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ArrivalProof } from '@/components/molecules/ArrivalProof/ArrivalProof';
import { PaymentInstructions } from '@/components/molecules/PaymentInstructions/PaymentInstructions';
import { PaymentProof } from '@/components/molecules/PaymentProof/PaymentProof';
import { ROUTES, myBidsTabHref } from '@/const/routes';
import type { CountdownTarget } from '@/hooks/use-countdown';
import {
  markWonLotDelivered,
  openClaim,
  type WonLotArrivalProof,
  type WonLotPaymentProof
} from '@/lib/data/lots';
import { formatPrice } from '@/lib/helpers/format-price';
import { formatBidCount, formatEndTime } from '@/lib/helpers/lot-card';
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
  wonLotStatusLabel,
  wonResultNextStep
} from '@/lib/helpers/won-lot';

export type WonLotPanelProps = {
  lotId: string;
  status: string;
  hasShippingAddress: boolean;
  claimWindowEndsAt: string | null;
  claim: { status: string; remedy: string; opened_at: string } | null;
  finalPrice: number | null;
  payBy: string | null;
  bank: { bank_name: string; bank_account_number: string; bank_account_holder: string } | null;
  // US-109 (D-077): the admin's decision on the transfer proof. The upload
  // control shows only while the lot is `won`.
  proof: WonLotPaymentProof;
  // US-110 (AC2): the "koi arrived healthy" proof, offered once the lot ships.
  arrivalProof: WonLotArrivalProof;
  now: number;
  bidCount?: number;
  endTime?: CountdownTarget;
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
  finalPrice,
  payBy,
  bank,
  proof,
  arrivalProof,
  now,
  bidCount,
  endTime
}: WonLotPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const label = wonLotStatusLabel(status);
  const action = wonLotAction(status);
  const nextStep = wonResultNextStep({ status, finalPrice, payBy });
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
      {/* US-100 AC1 (board 05 state 3): the result first, then what happens
          next. The `Menang` chip itself sits in the lot header. */}
      <div className="grid gap-1">
        <RenderIf when={finalPrice}>
          {(amount) => (
            <p className="text-sm font-semibold text-foreground">
              Anda menang dengan bid {formatPrice(amount)}
            </p>
          )}
        </RenderIf>
        <RenderIf when={endTime}>
          {(end) => (
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              <Clock aria-hidden className="size-3.5 shrink-0" />
              <span>
                Lelang selesai {formatEndTime(end, { year: true, weekday: 'long' })}
              </span>
              <span aria-hidden>·</span>
              <span>{formatBidCount(bidCount ?? 0)}</span>
            </p>
          )}
        </RenderIf>
      </div>

      <RenderIf when={nextStep}>
        {(text) => (
          <p className="text-sm font-medium text-foreground">Berikutnya: {text}</p>
        )}
      </RenderIf>

      <RenderIf when={label}>
        {(text) => <Badge variant="info">{text}</Badge>}
      </RenderIf>

      <RenderIf when={status === 'won'}>
        {() => (
          <>
            <PaymentInstructions finalPrice={finalPrice} payBy={payBy} bank={bank} now={now} />
            <PaymentProof lotId={lotId} proof={proof} />
          </>
        )}
      </RenderIf>

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
                {busy ? 'Memproses…' : 'Konfirmasi koi diterima'}
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

      {/* US-110 AC2 (D-074): the arrival proof is optional and separate from
          marking the lot delivered; the claim right stays untouched. */}
      <RenderIf when={status === 'shipped' || status === 'delivered'}>
        {() => <ArrivalProof lotId={lotId} proof={arrivalProof} />}
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
              id="lot-claim-video"
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

      {/* US-100 AC1, US-101 AC9: the tracking view is the lot's card in Bid
          Saya → Menang, not a second timeline on this page. */}
      <Link
        href={myBidsTabHref('menang')}
        className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-info-ink underline underline-offset-2"
      >
        Lacak pesanan
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

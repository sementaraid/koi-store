'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@koi/ui';
import { ROUTES } from '@/const/routes';
import { giveStrike } from '@/lib/data/strikes';
import {
  confirmLotPayment,
  getLotPaymentProofImage,
  rejectLotPaymentProof,
  type WonLotPayment
} from '@/lib/data/lot-payments';
import {
  confirmPaymentQuestion,
  formatPaymentAmount,
  lotPaymentLabel,
  lotPaymentTitle,
  paymentClosedAtLabel,
  paymentDeadlineLabel,
  paymentProofStatusLabel,
  paymentProofUploadedAtLabel,
  PAYMENT_PROOF_REASON_MAX
} from '@/lib/helpers/lot-payment-format';
import { STRIKE_REASON_MAX, strikeFailureInfo } from '@/lib/helpers/strike-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { RowActions, type RowAction } from './RowActions';

export type PaymentQueueProps = {
  lots: WonLotPayment[];
  total: number;
  overdueOnly: boolean;
};

export function PaymentQueue({ lots, total, overdueOnly }: PaymentQueueProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Saring pembayaran">
        <Button
          render={<Link href={ROUTES.payments} />}
          variant={overdueOnly ? 'outline' : 'solid'}
          size="sm"
          aria-current={overdueOnly ? undefined : 'page'}
        >
          Semua
        </Button>
        <Button
          render={<Link href={`${ROUTES.payments}?overdue=true`} />}
          variant={overdueOnly ? 'solid' : 'outline'}
          size="sm"
          aria-current={overdueOnly ? 'page' : undefined}
        >
          Lewat batas
        </Button>
      </div>

      {total > lots.length ? (
        <p className="text-sm text-muted-foreground">
          Menampilkan {lots.length} dari {total} pembayaran. Konfirmasi yang di atas untuk
          melihat sisanya.
        </p>
      ) : null}

      {lots.length === 0 ? (
        <AdminEmpty
          title={overdueOnly ? 'Tidak ada pembayaran yang lewat batas' : 'Tidak ada pembayaran yang menunggu'}
          description={
            overdueOnly
              ? 'Semua lot yang sudah menang dibayar dalam batas 1×24 jam.'
              : 'Pembayaran muncul di sini setelah lot dimenangkan dan menunggu konfirmasi.'
          }
        />
      ) : (
        <Table label="Pembayaran pemenang" minWidth="64rem">
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Kebun</TableHead>
              <TableHead>Pemenang</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Ditutup</TableHead>
              <TableHead>Batas bayar</TableHead>
              <TableHead>Bukti transfer</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => (
              <PaymentRow key={lot.id} lot={lot} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PaymentRow({ lot }: { lot: WonLotPayment }) {
  const router = useRouter();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [strikeOpen, setStrikeOpen] = useState(false);

  const actions: RowAction[] = [
    {
      label: 'Konfirmasi diterima',
      onSelect: () => setConfirmOpen(true),
      disabled: lot.final_price === null
    }
  ];

  if (lot.proof.status === 'pending') {
    actions.push({
      label: 'Tolak bukti',
      onSelect: () => setRejectOpen(true),
      tone: 'destructive'
    });
  }

  if (lot.overdue && lot.winner_customer_id) {
    actions.push({
      label: 'Beri strike',
      onSelect: () => setStrikeOpen(true),
      tone: 'destructive'
    });
  }

  function done() {
    setConfirmOpen(false);
    setRejectOpen(false);
    setStrikeOpen(false);
    router.refresh();
    requestAnimationFrame(() => {
      actionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  }

  return (
    <TableRow className={lot.overdue ? 'bg-warning/5' : undefined}>
      <TableCell>
        <p className="font-medium">{lotPaymentLabel(lot.lot_number, lot.title)}</p>
        {lot.overdue ? (
          <Badge
            variant="warning"
            icon={
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 4.75V8l2.25 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Lewat batas
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>{lot.seller.name || '—'}</TableCell>
      <TableCell>{lot.winner?.name || '—'}</TableCell>
      <TableCell className="tabular-nums">{formatPaymentAmount(lot.final_price)}</TableCell>
      <TableCell>{paymentClosedAtLabel(lot.closed_at)}</TableCell>
      <TableCell>{paymentDeadlineLabel(lot.pay_by)}</TableCell>
      <TableCell>
        <ProofCell lot={lot} />
      </TableCell>
      <TableCell>
        <PaymentDetail lot={lot} />
      </TableCell>
      <TableCell>
        <div ref={actionsRef} className="inline-flex">
          <RowActions
            label={`Aksi untuk ${lotPaymentLabel(lot.lot_number, lot.title)}`}
            actions={actions}
          />
        </div>

        <ConfirmPaymentDialog
          lot={lot}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onDone={done}
        />
        <RejectProofDialog
          lot={lot}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onDone={done}
        />
        <StrikeWinnerDialog
          lot={lot}
          open={strikeOpen}
          onOpenChange={setStrikeOpen}
          onDone={done}
        />
      </TableCell>
    </TableRow>
  );
}

function PaymentDetail({ lot }: { lot: WonLotPayment }) {
  return (
    <DetailDialog
      triggerLabel={`Lihat detail ${lotPaymentLabel(lot.lot_number, lot.title)}`}
      title="Detail pembayaran"
      media={lot.proof.has_image ? <ProofThumbnail id={lot.id} /> : null}
    >
      {() => (
        <>
          <DetailIdentity
            title={lotPaymentLabel(lot.lot_number, lot.title)}
            badge={
              <Badge variant={proofBadgeVariant(lot.proof.status)}>
                {paymentProofStatusLabel(lot.proof.status, lot.proof.reason)}
              </Badge>
            }
            secondary={`${lot.seller.name || '—'} · Pemenang ${lot.winner?.name || '—'}`}
          />

          <DetailPricePanel
            label="Nominal pembayaran"
            value={formatPaymentAmount(lot.final_price)}
            note={`Batas bayar ${paymentDeadlineLabel(lot.pay_by)}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Kebun">{lot.seller.name || '—'}</DetailItem>
            <DetailItem label="Pemenang">{lot.winner?.name || '—'}</DetailItem>
            <DetailItem label="Ditutup">{paymentClosedAtLabel(lot.closed_at)}</DetailItem>
            <DetailItem label="Batas bayar">{paymentDeadlineLabel(lot.pay_by)}</DetailItem>
            <DetailItem label="Lewat batas">{lot.overdue ? 'Ya' : 'Tidak'}</DetailItem>
          </DetailSection>

          <DetailSection title="Bukti transfer">
            <DetailItem label="Status">
              {paymentProofStatusLabel(lot.proof.status, lot.proof.reason)}
            </DetailItem>
            {lot.proof.reason ? (
              <DetailItem label="Alasan penolakan">{lot.proof.reason}</DetailItem>
            ) : null}
            <DetailItem label="Waktu unggah">
              {paymentProofUploadedAtLabel(lot.proof.uploaded_at) || '—'}
            </DetailItem>
            <DetailItem label="Gambar">
              {lot.proof.has_image ? 'Ada' : 'Tidak ada'}
            </DetailItem>
          </DetailSection>
        </>
      )}
    </DetailDialog>
  );
}

function proofBadgeVariant(status: string): 'warning' | 'signal' | 'success' | 'neutral' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'signal';
    case 'confirmed':
      return 'success';
    default:
      return 'neutral';
  }
}

function ProofCell({ lot }: { lot: WonLotPayment }) {
  const uploadedAt = paymentProofUploadedAtLabel(lot.proof.uploaded_at);

  return (
    <div className="grid justify-items-start gap-1.5">
      <Badge
        variant={proofBadgeVariant(lot.proof.status)}
        className="max-w-64 whitespace-normal text-left"
      >
        {paymentProofStatusLabel(lot.proof.status, lot.proof.reason)}
      </Badge>
      {uploadedAt ? <p className="text-xs text-muted-foreground">{uploadedAt}</p> : null}
    </div>
  );
}

function ProofThumbnail({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; url: string }
    | { status: 'error'; message: string }
  >({ status: 'loading' });
  const [url, setUrl] = useState<string | null>(null);

  // Loaded once per row. The blob URL stays in this component's state, so a
  // re-render or a queue refresh does not fetch the private file again unless
  // the row is replaced.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getLotPaymentProofImage(id);
      if (cancelled) return;

      if ('error' in result) {
        setState({ status: 'error', message: result.error });
        return;
      }

      const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
      const next = URL.createObjectURL(new Blob([bytes], { type: result.contentType }));
      setUrl(next);
      setState({ status: 'ready', url: next });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (state.status === 'ready') {
    return (
      <DetailMediaFrame>
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
        <img
          src={state.url}
          alt="Bukti transfer pemenang"
          className="size-full max-h-[420px] object-contain"
        />
      </DetailMediaFrame>
    );
  }

  if (state.status === 'error') {
    return <p className="max-w-40 text-xs text-destructive-ink">{state.message}</p>;
  }

  return (
    <p className="text-xs text-muted-foreground" role="status">
      Memuat bukti…
    </p>
  );
}

const rejectProofSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(PAYMENT_PROOF_REASON_MAX, `Alasan maksimal ${PAYMENT_PROOF_REASON_MAX} karakter`)
});

type RejectProofData = z.infer<typeof rejectProofSchema>;

const strikeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(STRIKE_REASON_MAX, `Alasan maksimal ${STRIKE_REASON_MAX} karakter`)
});

type StrikeData = z.infer<typeof strikeSchema>;

function ConfirmPaymentDialog({
  lot,
  open,
  onOpenChange,
  onDone
}: {
  lot: WonLotPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function changeOpen(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) setError(null);
  }

  async function confirm() {
    if (busy || lot.final_price === null) return;
    setBusy(true);
    setError(null);
    const result = await confirmLotPayment(lot.id);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success(`Pembayaran ${lotPaymentTitle(lot.title)} dikonfirmasi.`);
    onDone();
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={changeOpen}
      title={`Konfirmasi pembayaran ${lotPaymentLabel(lot.lot_number, lot.title)}?`}
      description={
        <>
          <span>
            {lot.final_price === null
              ? 'Nominal lot ini tidak tercatat. Periksa data lot sebelum mengonfirmasi.'
              : confirmPaymentQuestion(lot.final_price, lot.title)}
          </span>
          {error ? (
            <span role="alert" className="mt-2 block font-medium text-destructive-ink">
              {error}
            </span>
          ) : null}
        </>
      }
      confirmLabel="Ya, konfirmasi"
      busyLabel="Memproses…"
      onConfirm={confirm}
    />
  );
}

function RejectProofDialog({
  lot,
  open,
  onOpenChange,
  onDone
}: {
  lot: WonLotPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RejectProofData>({
    resolver: zodResolver(rejectProofSchema),
    defaultValues: { reason: '' }
  });
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: RejectProofData) {
    if (isSubmitting) return;
    setError(null);
    const result = await rejectLotPaymentProof(lot.id, data.reason);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success(`Bukti transfer ${lotPaymentTitle(lot.title)} ditolak.`);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Tolak bukti transfer {lotPaymentLabel(lot.lot_number, lot.title)}?</DialogTitle>
            <DialogDescription>
              Pemenang melihat alasan ini dan boleh mengunggah bukti lagi selama lot masih
              menang. Penolakan tidak memberi strike.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menolak bukti transfer">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`reject-proof-${lot.id}-reason`}
            label="Alasan penolakan"
            hint={`Minimal 5 karakter, maksimal ${PAYMENT_PROOF_REASON_MAX} karakter.`}
            maxLength={PAYMENT_PROOF_REASON_MAX}
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register('reason')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Ya, tolak'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// US-108 AC7 (D-079): the admin raises a winner's non-payment from this list.
// Only an overdue `won` row with a winner id can be struck; the backend's
// `GET /admin/lots` returns `winner_customer_id` for exactly this call.
function StrikeWinnerDialog({
  lot,
  open,
  onOpenChange,
  onDone
}: {
  lot: WonLotPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StrikeData>({
    resolver: zodResolver(strikeSchema),
    defaultValues: { reason: '' }
  });
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: StrikeData) {
    if (isSubmitting) return;
    setError(null);
    const result = await giveStrike({
      customer_id: lot.winner_customer_id ?? undefined,
      lot_id: lot.id,
      reason_type: 'winner_unpaid',
      reason: data.reason
    });

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setError(
        info.refresh
          ? 'Data strike sudah berubah. Tutup dialog lalu muat ulang daftar.'
          : info.message
      );
      return;
    }

    reset();
    toast.success('Strike diberikan.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Beri strike pemenang {lotPaymentTitle(lot.title)}?</DialogTitle>
            <DialogDescription>
              Lot ini lewat batas bayar dan belum dikonfirmasi. Strike ini tidak bisa dihapus,
              hanya dicabut dengan alasan. Dua strike aktif memblokir akun.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal memberi strike">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`strike-winner-${lot.id}-reason`}
            label="Alasan strike"
            hint={`Minimal 5 karakter, maksimal ${STRIKE_REASON_MAX} karakter.`}
            maxLength={STRIKE_REASON_MAX}
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register('reason')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Ya, beri strike'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from '@koi/ui';
import { ROUTES } from '@/const/routes';
import {
  getArrivalProof,
  payFarmPayout,
  refundFarmPayout,
  type FarmPayout
} from '@/lib/data/farm-payouts';
import { revealFarmPii } from '@/lib/data/farms';
import {
  type FarmPayoutTab,
  feeDigits,
  formatFeeDigits,
  payoutDueReasonLabel,
  payoutLotLabel,
  payoutNetAmount,
  payoutTimeLabel,
  PAYOUT_NOTE_MAX,
  PAYOUT_REFERENCE_MAX
} from '@/lib/helpers/farm-payout-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';
import { RowActions, type RowAction } from './RowActions';

export type FarmPayoutQueueProps = {
  payouts: FarmPayout[];
  total: number;
  status: FarmPayoutTab;
};

const TABS: { value: FarmPayoutTab; label: string }[] = [
  { value: 'due', label: 'Jatuh tempo' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'paid', label: 'Sudah ditransfer' }
];

const EMPTY: Record<FarmPayoutTab, string> = {
  due: 'Tidak ada pembayaran farm yang jatuh tempo.',
  pending: 'Belum ada pembayaran yang menunggu koi diterima.',
  paid: 'Belum ada pembayaran farm yang ditandai sudah ditransfer.'
};

export function FarmPayoutQueue({ payouts, total, status }: FarmPayoutQueueProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Saring pembayaran farm">
        {TABS.map((tab) => {
          const active = status === tab.value;
          const href =
            tab.value === 'due'
              ? ROUTES.farmPayouts
              : `${ROUTES.farmPayouts}?status=${tab.value}`;
          return (
            <Button
              key={tab.value}
              render={<Link href={href} />}
              variant={active ? 'solid' : 'outline'}
              size="sm"
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {total > payouts.length ? (
        <p className="text-sm text-muted-foreground">
          Menampilkan {payouts.length} dari {total} payout. Selesaikan yang di atas untuk
          melihat sisanya.
        </p>
      ) : null}

      {payouts.length === 0 ? (
        <AdminEmpty
          title={EMPTY[status]}
          description="Payout muncul di sini setelah koi diterima atau 3 hari setelah dikirim."
        />
      ) : (
        <Table label="Pembayaran ke farm" minWidth="72rem">
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Bruto</TableHead>
              <TableHead>Alasan jatuh tempo</TableHead>
              <TableHead>Jatuh tempo sejak</TableHead>
              <TableHead>Kondisi koi</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PayoutRow({ payout }: { payout: FarmPayout }) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{payoutLotLabel(payout.lot_number, payout.title)}</p>
        {payout.overdue ? (
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
            Lewat jatuh tempo
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>
        <p>{payout.farm.name || '—'}</p>
        <FarmBankAccount farmId={payout.farm.id} />
      </TableCell>
      <TableCell className="tabular-nums">{formatRupiah(payout.gross_amount)}</TableCell>
      <TableCell>{payoutDueReasonLabel(payout.due_reason)}</TableCell>
      <TableCell>{payoutTimeLabel(payout.due_at)}</TableCell>
      <TableCell>
        <ArrivalProofSummary payout={payout} />
      </TableCell>
      <TableCell>
        <PayoutDetail payout={payout} />
      </TableCell>
      <TableCell>
        <PayoutActions payout={payout} />
      </TableCell>
    </TableRow>
  );
}

function PayoutDetail({ payout }: { payout: FarmPayout }) {
  const statusLabel =
    payout.status === 'paid'
      ? 'Sudah ditransfer'
      : payout.status === 'pending'
        ? 'Menunggu koi diterima'
        : 'Jatuh tempo';
  const statusTone =
    payout.status === 'paid' ? 'success' : payout.status === 'pending' ? 'neutral' : 'warning';

  return (
    <DetailDialog
      triggerLabel={`Lihat detail ${payoutLotLabel(payout.lot_number, payout.title)}`}
      title="Detail pembayaran farm"
      media={
        payout.has_arrival_proof ? (
          <div className="grid gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Bukti kondisi koi
            </p>
            <ArrivalProofMedia id={payout.id} />
          </div>
        ) : null
      }
    >
      {() => (
        <>
          <DetailIdentity
            title={payoutLotLabel(payout.lot_number, payout.title)}
            badge={<Badge variant={statusTone}>{statusLabel}</Badge>}
            secondary={`${payout.farm.name || '—'} · ${payoutDueReasonLabel(payout.due_reason)}`}
          />

          <DetailPricePanel
            label="Bruto payout"
            value={formatRupiah(payout.gross_amount)}
            note={
              payout.net_amount !== null
                ? `Net diterima farm ${formatRupiah(payout.net_amount)}`
                : 'Payout belum ditransfer'
            }
          />

          <DetailSection title="Identitas">
            <DetailItem label="Farm">{payout.farm.name || '—'}</DetailItem>
            <DetailItem label="Rekening">
              <FarmBankAccount farmId={payout.farm.id} />
            </DetailItem>
            <DetailItem label="Jatuh tempo sejak">
              {payoutTimeLabel(payout.due_at)}
            </DetailItem>
            <DetailItem label="Lewat jatuh tempo">{payout.overdue ? 'Ya' : 'Tidak'}</DetailItem>
            <DetailItem label="Refund ke pemenang">
              {payout.refund_eligible ? 'Bisa direfund' : 'Tidak'}
            </DetailItem>
          </DetailSection>

          <DetailSection title="Pembayaran">
            <DetailItem label="Status">{statusLabel}</DetailItem>
            <DetailItem label="Ditransfer">
              {payout.paid_at ? payoutTimeLabel(payout.paid_at) : '—'}
            </DetailItem>
            <DetailItem label="Biaya transfer">
              {payout.bank_fee !== null ? formatRupiah(payout.bank_fee) : '—'}
            </DetailItem>
            <DetailItem label="Net diterima farm">
              {payout.net_amount !== null ? formatRupiah(payout.net_amount) : '—'}
            </DetailItem>
            <DetailItem label="Referensi transfer">
              {payout.transfer_reference ?? '—'}
            </DetailItem>
          </DetailSection>

          <DetailSection title="Bukti kondisi koi">
            <DetailItem label="Bukti">
              {payout.has_arrival_proof ? 'Ada' : 'Belum ada'}
            </DetailItem>
            {payout.has_arrival_proof ? (
              <DetailItem label="Diunggah">
                {payoutTimeLabel(payout.arrival_proof_uploaded_at)}
              </DetailItem>
            ) : null}
          </DetailSection>
        </>
      )}
    </DetailDialog>
  );
}

// AC4 / D-042: the bank account stays behind the existing logged reveal; the
// payout payload never carries bank fields.
function FarmBankAccount({ farmId }: { farmId: string }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'shown'; account: string | null; holder: string | null }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  async function reveal() {
    setState({ status: 'loading' });
    const [account, holder] = await Promise.all([
      revealFarmPii(farmId, 'account_number'),
      revealFarmPii(farmId, 'holder_name')
    ]);

    if ('error' in account) {
      setState({ status: 'error', message: account.error });
      return;
    }
    if ('error' in holder) {
      setState({ status: 'error', message: holder.error });
      return;
    }

    setState({ status: 'shown', account: account.value, holder: holder.value });
  }

  if (state.status === 'shown') {
    return (
      <p className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
        <span className="font-mono">{state.account ?? '—'}</span>
        <span>{state.holder ?? '—'}</span>
      </p>
    );
  }

  return (
    <div className="mt-1 grid justify-items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={reveal}
        disabled={state.status === 'loading'}
      >
        {state.status === 'loading' ? 'Memuat rekening…' : 'Tampilkan rekening'}
      </Button>
      {state.status === 'error' ? (
        <p role="alert" className="text-xs text-destructive-ink">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function ArrivalProofSummary({ payout }: { payout: FarmPayout }) {
  if (!payout.has_arrival_proof) {
    return <p className="text-xs text-muted-foreground">Belum ada bukti</p>;
  }

  return (
    <div className="grid gap-0.5 text-xs text-muted-foreground">
      <p>Bukti tersedia</p>
      <p>Diunggah {payoutTimeLabel(payout.arrival_proof_uploaded_at)}</p>
    </div>
  );
}

function ArrivalProofMedia({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; url: string; contentType: string }
    | { status: 'error'; message: string }
  >({ status: 'loading' });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getArrivalProof(id);
      if (cancelled) return;

      if ('error' in result) {
        setState({ status: 'error', message: result.error });
        return;
      }

      const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
      const next = URL.createObjectURL(new Blob([bytes], { type: result.contentType }));
      setUrl(next);
      setState({ status: 'ready', url: next, contentType: result.contentType });
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

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Memuat bukti kondisi koi…
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="text-sm text-destructive-ink">
        {state.message}
      </p>
    );
  }

  if (state.contentType.startsWith('video/')) {
    return (
      <DetailMediaFrame>
        <video
          src={state.url}
          aria-label="Video kondisi koi saat diterima"
          controls
          playsInline
          preload="metadata"
          className="size-full max-h-[420px] object-contain"
        >
          Browser Anda tidak mendukung pemutaran video.
        </video>
      </DetailMediaFrame>
    );
  }

  return (
    <DetailMediaFrame>
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
      <img
        src={state.url}
        alt="Foto kondisi koi saat diterima"
        className="size-full max-h-[420px] object-contain"
      />
    </DetailMediaFrame>
  );
}

const PAY_SCHEMA = z.object({
  fee: z
    .string()
    .trim()
    .min(1, 'Masukkan biaya transfer. Isi 0 bila bank tidak memungut biaya.')
    .regex(/^\d+$/, 'Biaya harus bilangan bulat 0 atau lebih'),
  transfer_reference: z
    .string()
    .trim()
    .max(PAYOUT_REFERENCE_MAX, `Referensi maksimal ${PAYOUT_REFERENCE_MAX} karakter`),
  note: z.string().trim().max(PAYOUT_NOTE_MAX, `Catatan maksimal ${PAYOUT_NOTE_MAX} karakter`)
});

type PayData = z.infer<typeof PAY_SCHEMA>;

const REFUND_SCHEMA = z.object({
  transfer_reference: z
    .string()
    .trim()
    .min(1, 'Referensi transfer wajib diisi.')
    .max(PAYOUT_REFERENCE_MAX, `Referensi maksimal ${PAYOUT_REFERENCE_MAX} karakter`),
  note: z.string().trim().max(PAYOUT_NOTE_MAX, `Catatan maksimal ${PAYOUT_NOTE_MAX} karakter`)
});

type RefundData = z.infer<typeof REFUND_SCHEMA>;

function PayoutActions({ payout }: { payout: FarmPayout }) {
  const [dialog, setDialog] = useState<'pay' | 'refund' | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const label = payoutLotLabel(payout.lot_number, payout.title);

  if (payout.status === 'paid') {
    return (
      <div className="grid gap-0.5 text-xs text-muted-foreground">
        <p className="text-sm font-medium text-foreground">
          Ditransfer {payoutTimeLabel(payout.paid_at)}
        </p>
        <p>
          Bruto {formatRupiah(payout.gross_amount)} · biaya{' '}
          {payout.bank_fee === null ? '—' : formatRupiah(payout.bank_fee)}
        </p>
        <p>Net {payout.net_amount === null ? '—' : formatRupiah(payout.net_amount)}</p>
        {payout.transfer_reference ? <p>Ref {payout.transfer_reference}</p> : null}
      </div>
    );
  }

  const actions: RowAction[] = [];
  if (payout.status === 'due') {
    actions.push({ label: 'Catat transfer', onSelect: () => setDialog('pay') });
  }
  if (payout.refund_eligible) {
    actions.push({
      label: 'Refund ke pemenang',
      tone: 'destructive',
      onSelect: () => setDialog('refund')
    });
  }

  if (actions.length === 0) {
    return <p className="text-xs text-muted-foreground">Menunggu koi diterima</p>;
  }

  const finalFocus = () => triggerRef.current?.querySelector('button') ?? null;

  return (
    <div className="grid justify-items-start gap-1.5">
      <div ref={triggerRef} className="inline-flex">
        {actions.length > 1 ? (
          <RowActions label={`Aksi pembayaran ${label}`} actions={actions} />
        ) : (
          <Button
            type="button"
            size="sm"
            variant={actions[0].tone === 'destructive' ? 'outline' : 'solid'}
            onClick={actions[0].onSelect}
          >
            {actions[0].label}
          </Button>
        )}
      </div>

      {dialog === 'pay' ? (
        <PayDialog
          payout={payout}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          finalFocus={finalFocus}
        />
      ) : null}

      {dialog === 'refund' ? (
        <RefundDialog
          payout={payout}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          finalFocus={finalFocus}
        />
      ) : null}
    </div>
  );
}

/* The dialog carries the amount, the consequence and an explicit "Ya, catat
   transfer" button, so it is the confirmation. */
function PayDialog({
  payout,
  open,
  onOpenChange,
  finalFocus
}: {
  payout: FarmPayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<PayData>({
    resolver: zodResolver(PAY_SCHEMA),
    defaultValues: { fee: '0', transfer_reference: '', note: '' }
  });
  const fee = watch('fee');
  const net = payoutNetAmount(payout.gross_amount, fee ? Number(fee) : 0);
  const feeError = errors.fee?.message;
  const referenceError = errors.transfer_reference?.message;
  const noteError = errors.note?.message;

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) setApiError(null);
  }

  async function submit(data: PayData) {
    if (isSubmitting) return;
    setApiError(null);
    const result = await payFarmPayout(payout.id, {
      bank_fee: Number(data.fee),
      transfer_reference: data.transfer_reference || undefined,
      note: data.note || undefined
    });

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    toast.success(`Transfer ke ${payout.farm.name || 'farm'} dicatat.`);
    onOpenChange(false);
    router.refresh();
  }

  const feeId = `payout-${payout.id}-fee`;
  const referenceId = `payout-${payout.id}-reference`;
  const noteId = `payout-${payout.id}-note`;
  const errorId = `payout-${payout.id}-error`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={!isSubmitting} finalFocus={finalFocus}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Catat transfer ke farm</DialogTitle>
            <DialogDescription>
              Transfer {formatRupiah(payout.gross_amount)} untuk{' '}
              {payoutLotLabel(payout.lot_number, payout.title)}. Payout yang sudah dicatat
              tidak bisa diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={feeId}>Biaya transfer bank (Rp)</Label>
            <Controller
              name="fee"
              control={control}
              render={({ field }) => (
                <Input
                  id={feeId}
                  name={field.name}
                  ref={field.ref}
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={isSubmitting}
                  value={formatFeeDigits(field.value)}
                  aria-invalid={feeError ? true : undefined}
                  aria-describedby={feeError ? `${feeId}-hint ${errorId}` : `${feeId}-hint`}
                  onChange={(event) => field.onChange(feeDigits(event.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p id={`${feeId}-hint`} className="text-xs text-muted-foreground">
              Biaya yang benar-benar dipotong bank, bilangan bulat. Isi 0 bila gratis.
            </p>
            {feeError ? (
              <p id={errorId} role="alert" className="text-xs text-destructive-ink">
                {feeError}
              </p>
            ) : null}
          </div>

          <dl className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
            <div className="flex justify-between gap-4">
              <dt>Bruto</dt>
              <dd className="tabular-nums">{formatRupiah(payout.gross_amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Biaya transfer</dt>
              <dd className="tabular-nums">{formatRupiah(fee ? Number(fee) : 0)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-medium">
              <dt>Net diterima farm</dt>
              <dd className="tabular-nums">{formatRupiah(net)}</dd>
            </div>
          </dl>

          <div className="grid gap-1.5">
            <Label htmlFor={referenceId}>Referensi transfer</Label>
            <Input
              id={referenceId}
              maxLength={PAYOUT_REFERENCE_MAX}
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={referenceError ? true : undefined}
              aria-describedby={referenceError ? `${referenceId}-hint ${referenceId}-error` : `${referenceId}-hint`}
              {...register('transfer_reference')}
            />
            <p id={`${referenceId}-hint`} className="text-xs text-muted-foreground">
              Opsional. Nomor referensi atau keterangan dari mutasi bank.
            </p>
            {referenceError ? (
              <p id={`${referenceId}-error`} role="alert" className="text-xs text-destructive-ink">
                {referenceError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={noteId}>Catatan</Label>
            <Textarea
              id={noteId}
              rows={2}
              maxLength={PAYOUT_NOTE_MAX}
              disabled={isSubmitting}
              aria-invalid={noteError ? true : undefined}
              aria-describedby={noteError ? `${noteId}-hint ${noteId}-error` : `${noteId}-hint`}
              {...register('note')}
            />
            <p id={`${noteId}-hint`} className="text-xs text-muted-foreground">
              Opsional. Maksimal {PAYOUT_NOTE_MAX} karakter.
            </p>
            {noteError ? (
              <p id={`${noteId}-error`} role="alert" className="text-xs text-destructive-ink">
                {noteError}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal mencatat transfer">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Ya, catat transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  payout,
  open,
  onOpenChange,
  finalFocus
}: {
  payout: FarmPayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RefundData>({
    resolver: zodResolver(REFUND_SCHEMA),
    defaultValues: { transfer_reference: '', note: '' }
  });
  const referenceError = errors.transfer_reference?.message;
  const noteError = errors.note?.message;

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) setApiError(null);
  }

  async function submit(data: RefundData) {
    if (isSubmitting) return;
    setApiError(null);
    const result = await refundFarmPayout(payout.id, {
      transfer_reference: data.transfer_reference,
      note: data.note || undefined
    });

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    toast.success('Refund ke pemenang dicatat. Farm tidak dibayar untuk lot ini.');
    onOpenChange(false);
    router.refresh();
  }

  const referenceId = `payout-${payout.id}-refund-reference`;
  const noteId = `payout-${payout.id}-refund-note`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={!isSubmitting} finalFocus={finalFocus}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Refund ke pemenang</DialogTitle>
            <DialogDescription>
              Kembalikan {formatRupiah(payout.gross_amount)} dari rekening perusahaan ke
              pemenang untuk {payoutLotLabel(payout.lot_number, payout.title)}. Payout farm
              menjadi batal dan tidak akan ditransfer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={referenceId}>Referensi transfer refund</Label>
            <Input
              id={referenceId}
              maxLength={PAYOUT_REFERENCE_MAX}
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={referenceError ? true : undefined}
              aria-describedby={
                referenceError ? `${referenceId}-hint ${referenceId}-error` : `${referenceId}-hint`
              }
              {...register('transfer_reference')}
            />
            <p id={`${referenceId}-hint`} className="text-xs text-muted-foreground">
              Wajib diisi. Nomor referensi atau keterangan dari mutasi bank.
            </p>
            {referenceError ? (
              <p id={`${referenceId}-error`} role="alert" className="text-xs text-destructive-ink">
                {referenceError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={noteId}>Catatan</Label>
            <Textarea
              id={noteId}
              rows={2}
              maxLength={PAYOUT_NOTE_MAX}
              disabled={isSubmitting}
              aria-invalid={noteError ? true : undefined}
              aria-describedby={noteError ? `${noteId}-hint ${noteId}-error` : `${noteId}-hint`}
              {...register('note')}
            />
            <p id={`${noteId}-hint`} className="text-xs text-muted-foreground">
              Opsional. Maksimal {PAYOUT_NOTE_MAX} karakter.
            </p>
            {noteError ? (
              <p id={`${noteId}-error`} role="alert" className="text-xs text-destructive-ink">
                {noteError}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal mencatat refund">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Ya, refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

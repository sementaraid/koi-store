'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
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
  paymentProofReasonError,
  paymentProofStatusLabel,
  paymentProofUploadedAtLabel,
  PAYMENT_PROOF_REASON_MAX
} from '@/lib/helpers/lot-payment-format';
import {
  STRIKE_REASON_MAX,
  strikeFailureInfo,
  strikeReasonError
} from '@/lib/helpers/strike-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';

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
        <div className="grid justify-items-start gap-1.5">
          <ConfirmPayment lot={lot} />
          {lot.proof.status === 'pending' ? <RejectProof lot={lot} /> : null}
          <StrikeWinner lot={lot} />
        </div>
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

function ConfirmPayment({ lot }: { lot: WonLotPayment }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const result = await confirmLotPayment(lot.id);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      if (result.refresh) {
        setOpen(false);
        router.refresh();
      }
      return;
    }

    setOpen(false);
    toast.success(`Pembayaran ${lotPaymentTitle(lot.title)} dikonfirmasi.`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={lot.final_price === null} />}>
        Konfirmasi diterima
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi pembayaran</DialogTitle>
          <DialogDescription>
            {lot.final_price === null
              ? 'Nominal lot ini tidak tercatat. Periksa data lot sebelum mengonfirmasi.'
              : confirmPaymentQuestion(lot.final_price, lot.title)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || lot.final_price === null}
          >
            {submitting ? 'Mengonfirmasi…' : 'Konfirmasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// US-108 AC7 (D-079): the admin raises a winner's non-payment from this list.
// Only an overdue `won` row with a winner id can be struck; the backend's
// `GET /admin/lots` returns `winner_customer_id` for exactly this call.
function StrikeWinner({ lot }: { lot: WonLotPayment }) {
  const id = `strike-winner-${lot.id}`;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!lot.overdue || !lot.winner_customer_id) return null;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = strikeReasonError(reason);
    if (message) {
      setError(message);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await giveStrike({
      customer_id: lot.winner_customer_id ?? undefined,
      lot_id: lot.id,
      reason_type: 'winner_unpaid',
      reason
    });
    setBusy(false);

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setError(info.message);
      toast.error(info.message);
      if (info.refresh) {
        setOpen(false);
        router.refresh();
      }
      return;
    }

    setReason('');
    setOpen(false);
    toast.success('Strike diberikan.');
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>
        Beri strike
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Beri strike pemenang</DialogTitle>
            <DialogDescription>
              {lotPaymentTitle(lot.title)} lewat batas bayar dan belum dikonfirmasi. Strike ini
              tidak bisa dihapus, hanya dicabut dengan alasan. Dua strike aktif memblokir akun.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-reason`}>Alasan strike</Label>
            <textarea
              id={`${id}-reason`}
              rows={3}
              maxLength={STRIKE_REASON_MAX}
              value={reason}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Wajib diisi. Maksimal {STRIKE_REASON_MAX} karakter.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Beri strike'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectProof({ lot }: { lot: WonLotPayment }) {
  const id = `reject-proof-${lot.id}`;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const reasonError = paymentProofReasonError(reason);
    if (reasonError) {
      setError(reasonError);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await rejectLotPaymentProof(lot.id, reason);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      if (result.refresh) {
        setOpen(false);
        router.refresh();
      }
      return;
    }

    setReason('');
    setOpen(false);
    toast.success(`Bukti transfer ${lotPaymentTitle(lot.title)} ditolak.`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Tolak bukti
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Tolak bukti transfer</DialogTitle>
            <DialogDescription>
              Pemenang melihat alasan ini dan boleh mengunggah bukti lagi selama lot masih
              menang. Penolakan tidak memberi strike.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-reason`}>Alasan penolakan</Label>
            <textarea
              id={`${id}-reason`}
              rows={3}
              maxLength={PAYMENT_PROOF_REASON_MAX}
              value={reason}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Wajib diisi. Maksimal {PAYMENT_PROOF_REASON_MAX} karakter.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? 'Menolak…' : 'Tolak bukti'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

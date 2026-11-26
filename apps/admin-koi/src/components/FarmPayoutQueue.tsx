'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label
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
  feeFromDigits,
  formatFeeDigits,
  payoutDueReasonLabel,
  payoutFeeError,
  payoutLotLabel,
  payoutNetAmount,
  payoutReferenceError,
  payoutTimeLabel,
  PAYOUT_NOTE_MAX,
  PAYOUT_REFERENCE_MAX
} from '@/lib/helpers/farm-payout-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';

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
    <Card>
      <CardHeader>
        <CardTitle>Pembayaran ke farm</CardTitle>
        <CardDescription>
          Catat transfer ke rekening farm setelah koi diterima atau 3 hari setelah dikirim.
          Payout yang sudah dibayar tidak bisa diubah.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <caption className="sr-only">
                Payout ke farm, {TABS.find((tab) => tab.value === status)?.label.toLowerCase()}.
                Kolom bukti kondisi koi membuka foto atau video yang diunggah pemenang.
              </caption>
              <thead className="border-b border-border text-xs text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="p-2 font-medium">
                    Lot
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Farm
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Bruto
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Alasan jatuh tempo
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Jatuh tempo sejak
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Kondisi koi
                  </th>
                  <th scope="col" className="p-2 font-medium">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <PayoutRow key={payout.id} payout={payout} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PayoutRow({ payout }: { payout: FarmPayout }) {
  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="p-2">
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
      </td>
      <td className="p-2">
        <p>{payout.farm.name || '—'}</p>
        <FarmBankAccount farmId={payout.farm.id} />
      </td>
      <td className="p-2 tabular-nums">{formatRupiah(payout.gross_amount)}</td>
      <td className="p-2">{payoutDueReasonLabel(payout.due_reason)}</td>
      <td className="p-2">{payoutTimeLabel(payout.due_at)}</td>
      <td className="p-2">
        <ArrivalProofCell payout={payout} />
      </td>
      <td className="p-2">
        <PayoutActions payout={payout} />
      </td>
    </tr>
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

function ArrivalProofCell({ payout }: { payout: FarmPayout }) {
  if (!payout.has_arrival_proof) {
    return <p className="text-xs text-muted-foreground">Belum ada bukti</p>;
  }

  return (
    <div className="grid justify-items-start gap-1">
      <ArrivalProofDialog payout={payout} />
      <p className="text-xs text-muted-foreground">
        Diunggah {payoutTimeLabel(payout.arrival_proof_uploaded_at)}
      </p>
    </div>
  );
}

// AC4 / D-018: the private photo or video opens in a viewer; no external URL.
function ArrivalProofDialog({ payout }: { payout: FarmPayout }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Lihat bukti
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kondisi koi saat diterima</DialogTitle>
          <DialogDescription>
            {payoutLotLabel(payout.lot_number, payout.title)} · diunggah{' '}
            {payoutTimeLabel(payout.arrival_proof_uploaded_at)}
          </DialogDescription>
        </DialogHeader>
        {open ? <ArrivalProofMedia id={payout.id} /> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Tutup</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <video
        src={state.url}
        controls
        preload="metadata"
        className="max-h-[60dvh] w-fit max-w-full rounded-md border border-border"
      >
        Browser Anda tidak mendukung pemutaran video.
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset
    <img
      src={state.url}
      alt="Foto kondisi koi saat diterima"
      className="max-h-[60dvh] w-fit max-w-full rounded-md border border-border"
    />
  );
}

function PayoutActions({ payout }: { payout: FarmPayout }) {
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

  return (
    <div className="grid justify-items-start gap-1.5">
      {payout.status === 'due' ? <RecordTransfer payout={payout} /> : null}
      {payout.status === 'pending' ? (
        <p className="text-xs text-muted-foreground">Menunggu koi diterima</p>
      ) : null}
      {payout.refund_eligible ? <RefundPayout payout={payout} /> : null}
    </div>
  );
}

function RecordTransfer({ payout }: { payout: FarmPayout }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fee, setFee] = useState('0');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const feeValue = feeFromDigits(fee);
  const net = payoutNetAmount(payout.gross_amount, feeValue ?? 0);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const feeError = payoutFeeError(fee);
    if (feeError) {
      setError(feeError);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await payFarmPayout(payout.id, {
      bank_fee: Number(fee),
      transfer_reference: reference.trim() || undefined,
      note: note.trim() || undefined
    });
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

    setOpen(false);
    toast.success(`Transfer ke ${payout.farm.name || 'farm'} dicatat.`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="sm" />}>Catat transfer</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Catat transfer ke farm</DialogTitle>
            <DialogDescription>
              Transfer {formatRupiah(payout.gross_amount)} untuk{' '}
              {payoutLotLabel(payout.lot_number, payout.title)}. Payout yang sudah dicatat
              tidak bisa diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`payout-${payout.id}-fee`}>Biaya transfer bank (Rp)</Label>
            <Input
              id={`payout-${payout.id}-fee`}
              inputMode="numeric"
              autoComplete="off"
              value={formatFeeDigits(fee)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `payout-${payout.id}-error` : undefined}
              onChange={(event) => {
                setFee(feeDigits(event.target.value));
                if (error) setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Biaya yang benar-benar dipotong bank, bilangan bulat. Isi 0 bila gratis.
            </p>
          </div>

          <dl
            className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm"
            aria-live="polite"
          >
            <div className="flex justify-between gap-4">
              <dt>Bruto</dt>
              <dd className="tabular-nums">{formatRupiah(payout.gross_amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Biaya transfer</dt>
              <dd className="tabular-nums">{formatRupiah(feeValue ?? 0)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-medium">
              <dt>Net diterima farm</dt>
              <dd className="tabular-nums">{formatRupiah(net)}</dd>
            </div>
          </dl>

          <div className="grid gap-1.5">
            <Label htmlFor={`payout-${payout.id}-reference`}>Referensi transfer</Label>
            <Input
              id={`payout-${payout.id}-reference`}
              maxLength={PAYOUT_REFERENCE_MAX}
              autoComplete="off"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opsional. Nomor referensi atau keterangan dari mutasi bank.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`payout-${payout.id}-note`}>Catatan</Label>
            <textarea
              id={`payout-${payout.id}-note`}
              rows={2}
              maxLength={PAYOUT_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            <p className="text-xs text-muted-foreground">
              Opsional. Maksimal {PAYOUT_NOTE_MAX} karakter.
            </p>
          </div>

          {error ? (
            <p id={`payout-${payout.id}-error`} role="alert" className="text-xs text-destructive-ink">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefundPayout({ payout }: { payout: FarmPayout }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const referenceError = payoutReferenceError(reference);
    if (referenceError) {
      setError(referenceError);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await refundFarmPayout(payout.id, {
      transfer_reference: reference,
      note: note.trim() || undefined
    });
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

    setOpen(false);
    toast.success('Refund ke pemenang dicatat. Farm tidak dibayar untuk lot ini.');
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Refund ke pemenang
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Refund ke pemenang</DialogTitle>
            <DialogDescription>
              Kembalikan {formatRupiah(payout.gross_amount)} dari rekening perusahaan ke
              pemenang untuk {payoutLotLabel(payout.lot_number, payout.title)}. Payout farm
              menjadi batal dan tidak akan ditransfer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`payout-${payout.id}-refund-reference`}>
              Referensi transfer refund
            </Label>
            <Input
              id={`payout-${payout.id}-refund-reference`}
              maxLength={PAYOUT_REFERENCE_MAX}
              autoComplete="off"
              value={reference}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `payout-${payout.id}-refund-error` : undefined}
              onChange={(event) => {
                setReference(event.target.value);
                if (error) setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Wajib diisi. Nomor referensi atau keterangan dari mutasi bank.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`payout-${payout.id}-refund-note`}>Catatan</Label>
            <textarea
              id={`payout-${payout.id}-refund-note`}
              rows={2}
              maxLength={PAYOUT_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            <p className="text-xs text-muted-foreground">
              Opsional. Maksimal {PAYOUT_NOTE_MAX} karakter.
            </p>
          </div>

          {error ? (
            <p
              id={`payout-${payout.id}-refund-error`}
              role="alert"
              className="text-xs text-destructive-ink"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Catat refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField
} from '@koi/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@koi/ui/primitives/tabs';
import {
  approveFarm,
  getFarmKtp,
  rejectFarm,
  revealFarmPii,
  type AdminFarm,
  type FarmApplicant,
  type FarmPiiField
} from '@/lib/data/farms';
import {
  farmPiiFieldLabel,
  farmStatusLabel,
  farmStatusTone,
  formatFarmDate
} from '@/lib/helpers/farm-format';

/** Props for {@link FarmQueue}. */
export type FarmQueueProps = {
  /** Registrations still waiting on a decision, oldest first. */
  pending: AdminFarm[];
  /** How many are waiting in total; may exceed `pending.length`. */
  pendingTotal: number;
  /** Registrations already decided, newest first. */
  decided: AdminFarm[];
};

/**
 * The farm registration queue (US-021): KTP, farm photos and the bank account
 * name beside the applicant's, then approve or reject with a reason.
 *
 * @remarks
 * Decided registrations sit in their own tab for the same reason the top-up
 * queue splits them: the operator's job is the pending list, and a decided row
 * between two pending ones invites a second decision on the same farm.
 *
 * There is deliberately no unsuspend action anywhere on this screen: a
 * rejection is final, and Mercur's unsuspend would move the seller straight to
 * `open` without an approval (D-015).
 */
export function FarmQueue({ pending, pendingTotal, decided }: FarmQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendaftaran kebun</CardTitle>
        <CardDescription>
          Periksa KTP, foto kebun, dan cocokkan nama pemilik rekening dengan nama pendaftar
          sebelum memutuskan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="gap-4">
          <TabsList>
            <TabsTrigger value="pending">Menunggu ({pendingTotal})</TabsTrigger>
            <TabsTrigger value="decided">Sudah diputuskan ({decided.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="grid gap-3">
            {pendingTotal > pending.length ? (
              <p className="text-sm text-muted-foreground">
                Menampilkan {pending.length} dari {pendingTotal} pendaftaran. Selesaikan yang
                di atas untuk melihat sisanya.
              </p>
            ) : null}
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada pendaftaran kebun yang menunggu.
              </p>
            ) : (
              pending.map((farm) => <PendingRow key={farm.id} farm={farm} />)
            )}
          </TabsContent>

          <TabsContent value="decided" className="grid gap-3">
            {decided.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada pendaftaran yang diputuskan.
              </p>
            ) : (
              decided.map((farm) => <DecidedRow key={farm.id} farm={farm} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** The applicant's name, or their email when the API sent no name. */
function applicantName(applicant: FarmApplicant | null): string {
  if (!applicant) return '—';
  const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(' ');
  return name || applicant.email || '—';
}

/** One pending registration: the facts, the evidence, and the two decisions. */
function PendingRow({ farm }: { farm: AdminFarm }) {
  /* One decision at a time per row: approving while a rejection is on the wire
     is two answers to one question. */
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <div className="grid gap-1 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
        <p className="text-base font-medium">{farm.name}</p>
        <div className="grid gap-0.5 text-sm">
          <p className="text-muted-foreground">
            {formatFarmDate(farm.created_at)} · {farm.email}
            {farm.phone ? (
              <>
                {' · '}
                <RevealValue farmId={farm.id} field="phone" masked={farm.phone} />
              </>
            ) : null}
          </p>
          <div>
            <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-1 text-sm">
        <p className="font-medium">Pendaftar</p>
        <p className="text-muted-foreground">
          {applicantName(farm.applicant)}
          {farm.applicant?.phone ? (
            <>
              {' · '}
              <RevealValue farmId={farm.id} field="applicant_phone" masked={farm.applicant.phone} />
            </>
          ) : null}
        </p>
        {farm.address ? (
          <p className="text-muted-foreground">
            {[farm.address.address_1, farm.address.city, farm.address.province]
              .filter(Boolean)
              .join(', ')}
          </p>
        ) : null}
        {farm.description ? <p>{farm.description}</p> : null}
        {farm.ktp_nik ? (
          <p className="text-muted-foreground">
            NIK: <RevealValue farmId={farm.id} field="ktp_nik" masked={farm.ktp_nik} />
          </p>
        ) : null}
      </div>

      <PaymentCheck farm={farm} />

      {farm.has_ktp_photo ? (
        <KtpView id={farm.id} />
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada foto KTP.</p>
      )}

      {farm.farm_photo_urls.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Foto kebun</p>
          <div className="flex flex-wrap gap-2">
            {farm.farm_photo_urls.map((url) => (
              /* eslint-disable-next-line @next/next/no-img-element -- public upload URL from the backend's own file origin */
              <img
                key={url}
                src={url}
                alt="Foto kebun"
                className="h-28 w-40 rounded-md border border-border object-cover"
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada foto kebun.</p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ApproveForm id={farm.id} busy={busy} onBusyChange={setBusy} />
        <RejectForm id={farm.id} busy={busy} onBusyChange={setBusy} />
      </div>
    </div>
  );
}

/**
 * The bank account beside the applicant's name (US-021 AC1).
 *
 * @remarks
 * The comparison only ever claims what the data supports: a mismatch is shown
 * loudly, a match quietly, and missing data says it could not compare — that
 * is the case the admin must chase, and a silent blank would read as a match.
 */
function PaymentCheck({ farm }: { farm: AdminFarm }) {
  const payment = farm.payment_details;
  const match = farm.holder_matches_applicant;

  return (
    <div className="grid gap-1 rounded-md border border-border p-2 text-sm">
      <p className="font-medium">Rekening pembayaran</p>
      {payment ? (
        <p>
          {payment.bank_name ?? '—'}
          {payment.account_number ? (
            <>
              {' · '}
              <RevealValue farmId={farm.id} field="account_number" masked={payment.account_number} />
            </>
          ) : null}
          {' a/n '}
          {payment.holder_name ? (
            <RevealValue farmId={farm.id} field="holder_name" masked={payment.holder_name} />
          ) : (
            '—'
          )}
        </p>
      ) : (
        <p className="text-muted-foreground">Tidak ada data rekening.</p>
      )}
      {match === false ? (
        <p role="alert" className="font-medium text-destructive-ink">
          Nama pemilik rekening berbeda dengan nama pendaftar. Periksa sebelum menyetujui.
        </p>
      ) : match === true ? (
        <p className="text-muted-foreground">Nama pemilik rekening cocok dengan pendaftar.</p>
      ) : (
        <p className="text-muted-foreground">
          Nama pemilik rekening tidak bisa dibandingkan (data rekening atau nama pendaftar
          tidak lengkap).
        </p>
      )}
    </div>
  );
}

/**
 * One masked PII value with an explicit "Tampilkan" control (US-092 T-092.3,
 * D-042).
 *
 * @remarks
 * The mask is whatever the backend sent; this never re-masks and never asks for
 * the full value on render, because every reveal writes an audit row. The full
 * value lives in this component's state only and is dropped on "Sembunyikan" or
 * when the row unmounts.
 */
function RevealValue({
  farmId,
  field,
  masked
}: {
  farmId: string;
  field: FarmPiiField;
  masked: string;
}) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'shown'; value: string | null }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  async function reveal() {
    setState({ status: 'loading' });
    const result = await revealFarmPii(farmId, field);

    if ('error' in result) {
      setState({ status: 'error', message: result.error });
      return;
    }

    setState({ status: 'shown', value: result.value });
  }

  if (state.status === 'shown') {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="font-mono">{state.value ?? '—'}</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setState({ status: 'idle' })}
        >
          Sembunyikan
        </Button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="sr-only">{farmPiiFieldLabel(field)} disamarkan: </span>
      <span className="font-mono tracking-wide">{masked}</span>
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={reveal}
        disabled={state.status === 'loading'}
        aria-label={`Tampilkan ${farmPiiFieldLabel(field)} lengkap`}
      >
        {state.status === 'loading' ? 'Memuat…' : 'Tampilkan'}
      </Button>
      {state.status === 'error' ? (
        <span role="alert" className="text-xs text-destructive-ink">
          {state.message}
        </span>
      ) : null}
    </span>
  );
}

/** One decided registration: its outcome and, if rejected, the reason. */
function DecidedRow({ farm }: { farm: AdminFarm }) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{farm.name}</p>
        <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
      </div>
      <p className="text-muted-foreground">
        {formatFarmDate(farm.created_at)} · {farm.email} · {applicantName(farm.applicant)}
      </p>
      {farm.approved_at ? (
        <p className="text-muted-foreground">Disetujui {formatFarmDate(farm.approved_at)}</p>
      ) : null}
      {farm.rejected_at ? (
        <p className="text-muted-foreground">Ditolak {formatFarmDate(farm.rejected_at)}</p>
      ) : null}
      {farm.status_reason ? <p>Alasan: {farm.status_reason}</p> : null}
    </div>
  );
}

/**
 * The KTP photo, fetched through the admin-only route (D-017).
 *
 * @remarks
 * Never a URL: the bytes arrive as base64 from the server action and become a
 * blob URL here, revoked when this row unmounts or the operator asks again.
 */
function KtpView({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; url: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [url, setUrl] = useState<string | null>(null);

  /* One effect owns the URL's whole life: revoke the previous one when it is
     replaced, and the current one on unmount. */
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  async function load() {
    setState({ status: 'loading' });
    const result = await getFarmKtp(id);

    if ('error' in result) {
      setState({ status: 'error', message: result.error });
      return;
    }

    const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
    const next = URL.createObjectURL(new Blob([bytes], { type: result.contentType }));
    setUrl(next);
    setState({ status: 'ready', url: next });
  }

  if (state.status === 'ready') {
    return (
      <div className="grid gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
        <img
          src={state.url}
          alt="Foto KTP"
          className="max-h-96 w-fit max-w-full rounded-md border border-border object-contain"
        />
        <div>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Muat ulang foto KTP
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={load}
          disabled={state.status === 'loading'}
        >
          {state.status === 'loading' ? 'Memuat foto KTP…' : 'Lihat foto KTP'}
        </Button>
      </div>
      {state.status === 'error' ? (
        <p role="alert" className="text-xs text-destructive-ink">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

/** Approve: the farmer gains access (US-021 AC2). */
function ApproveForm({
  id,
  busy,
  onBusyChange
}: {
  id: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function approve() {
    /* Busy before the dialog: a second click while `confirm()` is open is the
       same double approval. */
    onBusyChange(true);
    if (!confirm('Setujui pendaftaran kebun ini dan beri akses petani?')) {
      onBusyChange(false);
      return;
    }

    setSubmitting(true);
    const result = await approveFarm(id);
    setSubmitting(false);
    onBusyChange(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Kebun disetujui.');
  }

  return (
    <div>
      <Button type="button" size="sm" onClick={approve} disabled={submitting || busy}>
        {submitting ? 'Menyetujui…' : 'Setujui kebun'}
      </Button>
    </div>
  );
}

/* A rejection is final and the farmer reads the reason, so it must be written (AC2, D-015). */
const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Masukkan alasan penolakan')
});

type RejectData = z.infer<typeof rejectSchema>;

/** Reject, with the reason the farmer will see. */
function RejectForm({
  id,
  busy,
  onBusyChange
}: {
  id: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RejectData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' }
  });

  async function submit(data: RejectData) {
    onBusyChange(true);
    if (!confirm('Tolak pendaftaran kebun ini? Keputusan ini final dan tidak bisa dibatalkan.')) {
      onBusyChange(false);
      return;
    }

    const result = await rejectFarm(id, data.reason);
    onBusyChange(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Kebun ditolak.');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <FormField
        label="Alasan penolakan"
        hint="Pendaftar akan membaca alasan ini. Penolakan final, tanpa pendaftaran ulang."
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div>
        <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting || busy}>
          {isSubmitting ? 'Menolak…' : 'Tolak kebun'}
        </Button>
      </div>
    </form>
  );
}

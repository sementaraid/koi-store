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

import { AdminEmpty } from './AdminEmpty';
import { ConfirmDialog } from './ConfirmDialog';

export type FarmQueueProps = {
  pending: AdminFarm[];
  pendingTotal: number;
  decided: AdminFarm[];
};

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
              <AdminEmpty
                title="Tidak ada pendaftaran kebun yang menunggu"
                description="Pendaftaran baru muncul di sini setelah petani mengirim datanya."
              />
            ) : (
              pending.map((farm) => <PendingRow key={farm.id} farm={farm} />)
            )}
          </TabsContent>

          <TabsContent value="decided" className="grid gap-3">
            {decided.length === 0 ? (
              <AdminEmpty
                title="Belum ada pendaftaran yang diputuskan"
                description="Kebun yang disetujui atau ditolak muncul di sini."
              />
            ) : (
              decided.map((farm) => <DecidedRow key={farm.id} farm={farm} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function applicantName(applicant: FarmApplicant | null): string {
  if (!applicant) return '—';
  const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(' ');
  return name || applicant.email || '—';
}

function PendingRow({ farm }: { farm: AdminFarm }) {
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

function KtpView({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; url: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [url, setUrl] = useState<string | null>(null);

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
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function approve() {
    onBusyChange(true);
    setSubmitting(true);
    const result = await approveFarm(id);
    setSubmitting(false);
    onBusyChange(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Kebun disetujui.');
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={submitting || busy}
      >
        {submitting ? 'Menyetujui…' : 'Setujui kebun'}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Setujui kebun?"
        description="Setujui pendaftaran kebun ini dan beri akses petani?"
        confirmLabel="Setujui kebun"
        busyLabel="Menyetujui…"
        onConfirm={approve}
      />
    </div>
  );
}

const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Masukkan alasan penolakan')
});

type RejectData = z.infer<typeof rejectSchema>;

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState('');

  function submit(data: RejectData) {
    setPendingReason(data.reason);
    setConfirmOpen(true);
  }

  async function reject() {
    onBusyChange(true);
    const result = await rejectFarm(id, pendingReason);
    onBusyChange(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Kebun ditolak.');
    setPendingReason('');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <FormField
        id={`farm-${id}-reject-reason`}
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Tolak pendaftaran kebun?"
        description="Tolak pendaftaran kebun ini? Keputusan ini final dan tidak bisa dibatalkan."
        confirmLabel="Tolak kebun"
        busyLabel="Menolak…"
        destructive
        onConfirm={reject}
      />
    </form>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailMediaStage,
  DetailSection
} from './DetailDialog';
import { RowActions } from './RowActions';

export type FarmQueueProps = {
  pending: AdminFarm[];
  pendingTotal: number;
  decided: AdminFarm[];
};

export function FarmQueue({ pending, pendingTotal, decided }: FarmQueueProps) {
  return (
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
          <Table label="Pendaftaran kebun yang menunggu" minWidth="72rem">
            <TableHeader>
              <TableRow>
                <TableHead>Kebun</TableHead>
                <TableHead>Pendaftar</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((farm) => (
                <PendingRow key={farm.id} farm={farm} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="decided" className="grid gap-3">
        {decided.length === 0 ? (
          <AdminEmpty
            title="Belum ada pendaftaran yang diputuskan"
            description="Kebun yang disetujui atau ditolak muncul di sini."
          />
        ) : (
          <Table label="Pendaftaran kebun yang sudah diputuskan" minWidth="56rem">
            <TableHeader>
              <TableRow>
                <TableHead>Kebun</TableHead>
                <TableHead>Pendaftar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decided.map((farm) => (
                <DecidedRow key={farm.id} farm={farm} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}

function applicantName(applicant: FarmApplicant | null): string {
  if (!applicant) return '—';
  const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(' ');
  return name || applicant.email || '—';
}

function PendingRow({ farm }: { farm: AdminFarm }) {
  const router = useRouter();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // After a successful decision the row usually leaves this queue, so the
  // trigger may be gone by the next paint. Focus it when it is still there.
  function done() {
    setApproveOpen(false);
    setRejectOpen(false);
    router.refresh();
    requestAnimationFrame(() => {
      actionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{farm.name}</p>
        <p className="mt-1 text-muted-foreground">
          {formatFarmDate(farm.created_at)} · {farm.email}
          {farm.phone ? (
            <>
              {' · '}
              <RevealValue farmId={farm.id} field="phone" masked={farm.phone} />
            </>
          ) : null}
        </p>
        <div className="mt-1">
          <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
        </div>
      </TableCell>

      <TableCell>
        <p className="font-medium">{applicantName(farm.applicant)}</p>
        {farm.applicant?.phone ? (
          <p className="text-muted-foreground">
            <RevealValue farmId={farm.id} field="applicant_phone" masked={farm.applicant.phone} />
          </p>
        ) : null}
        {farm.address ? (
          <p className="text-muted-foreground">
            {[farm.address.address_1, farm.address.city, farm.address.province]
              .filter(Boolean)
              .join(', ')}
          </p>
        ) : null}
        {farm.ktp_nik ? (
          <p className="text-muted-foreground">
            NIK: <RevealValue farmId={farm.id} field="ktp_nik" masked={farm.ktp_nik} />
          </p>
        ) : null}
        {farm.description ? <p className="mt-1">{farm.description}</p> : null}
      </TableCell>

      <TableCell>
        <PaymentCheck farm={farm} />
      </TableCell>

      <TableCell>
        <div className="grid gap-2">
          <FarmDetail farm={farm} />
        </div>
      </TableCell>

      <TableCell>
        <div ref={actionsRef} className="inline-flex">
          <RowActions
            label={`Aksi untuk ${farm.name}`}
            actions={[
              {
                label: 'Setujui kebun',
                onSelect: () => setApproveOpen(true)
              },
              {
                label: 'Tolak kebun',
                onSelect: () => setRejectOpen(true),
                tone: 'destructive'
              }
            ]}
          />
        </div>

        <ApproveFarmDialog
          id={farm.id}
          name={farm.name}
          open={approveOpen}
          onOpenChange={setApproveOpen}
          onDone={done}
        />
        <RejectFarmDialog
          id={farm.id}
          name={farm.name}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onDone={done}
        />
      </TableCell>
    </TableRow>
  );
}

function FarmDetail({ farm }: { farm: AdminFarm }) {
  const photos = farm.farm_photo_urls.map((url) => ({
    src: url,
    kind: 'image' as const,
    alt: `Foto kebun ${farm.name}`
  }));
  const hasMedia = photos.length > 0 || farm.has_ktp_photo;
  const media = hasMedia ? (
    <>
      {photos.length > 0 ? <DetailMediaStage items={photos} /> : null}
      {farm.has_ktp_photo ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Foto KTP
          </p>
          <KtpView id={farm.id} />
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <DetailDialog
      triggerLabel={`Lihat detail kebun ${farm.name}`}
      title="Detail kebun"
      media={media}
    >
      {() => (
        <>
          <DetailIdentity
            title={farm.name}
            badge={
              <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
            }
            secondary={`${formatFarmDate(farm.created_at)} · ${farm.email}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Telepon">
              {farm.phone ? (
                <RevealValue farmId={farm.id} field="phone" masked={farm.phone} />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Pendaftar">{applicantName(farm.applicant)}</DetailItem>
            <DetailItem label="Telepon pendaftar">
              {farm.applicant?.phone ? (
                <RevealValue
                  farmId={farm.id}
                  field="applicant_phone"
                  masked={farm.applicant.phone}
                />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Alamat">
              {farm.address
                ? [farm.address.address_1, farm.address.city, farm.address.province]
                    .filter(Boolean)
                    .join(', ')
                : '—'}
            </DetailItem>
            <DetailItem label="NIK">
              {farm.ktp_nik ? (
                <RevealValue farmId={farm.id} field="ktp_nik" masked={farm.ktp_nik} />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Deskripsi">{farm.description || '—'}</DetailItem>
          </DetailSection>

          <DetailSection title="Rekening">
            <DetailItem label="Bank">{farm.payment_details?.bank_name ?? '—'}</DetailItem>
            <DetailItem label="Nomor rekening">
              {farm.payment_details?.account_number ? (
                <RevealValue
                  farmId={farm.id}
                  field="account_number"
                  masked={farm.payment_details.account_number}
                />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Nama pemilik">
              {farm.payment_details?.holder_name ? (
                <RevealValue
                  farmId={farm.id}
                  field="holder_name"
                  masked={farm.payment_details.holder_name}
                />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Kecocokan nama">
              {farm.holder_matches_applicant === false ? (
                <span className="text-destructive-ink">Berbeda dengan pendaftar</span>
              ) : farm.holder_matches_applicant === true ? (
                'Cocok dengan pendaftar'
              ) : (
                'Tidak bisa dibandingkan'
              )}
            </DetailItem>
          </DetailSection>

          <DetailSection title="Berkas">
            <DetailItem label="Foto kebun">
              {photos.length > 0 ? `${photos.length} foto` : 'Tidak ada foto kebun'}
            </DetailItem>
            <DetailItem label="Foto KTP">
              {farm.has_ktp_photo ? 'Ada' : 'Tidak ada foto KTP'}
            </DetailItem>
          </DetailSection>
        </>
      )}
    </DetailDialog>
  );
}

function PaymentCheck({ farm }: { farm: AdminFarm }) {
  const payment = farm.payment_details;
  const match = farm.holder_matches_applicant;

  return (
    <div className="grid gap-1 text-sm">
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
    <TableRow>
      <TableCell>
        <p className="font-medium">{farm.name}</p>
        <p className="text-muted-foreground">{farm.email}</p>
      </TableCell>
      <TableCell>{applicantName(farm.applicant)}</TableCell>
      <TableCell>
        <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
      </TableCell>
      <TableCell>
        <p className="text-muted-foreground">Didaftarkan {formatFarmDate(farm.created_at)}</p>
        {farm.approved_at ? (
          <p className="text-muted-foreground">Disetujui {formatFarmDate(farm.approved_at)}</p>
        ) : null}
        {farm.rejected_at ? (
          <p className="text-muted-foreground">Ditolak {formatFarmDate(farm.rejected_at)}</p>
        ) : null}
      </TableCell>
      <TableCell>{farm.status_reason ?? '—'}</TableCell>
      <TableCell>
        <DecidedFarmDetail farm={farm} />
      </TableCell>
    </TableRow>
  );
}

function DecidedFarmDetail({ farm }: { farm: AdminFarm }) {
  const photos = farm.farm_photo_urls.map((url) => ({
    src: url,
    kind: 'image' as const,
    alt: `Foto kebun ${farm.name}`
  }));
  const hasMedia = photos.length > 0 || farm.has_ktp_photo;
  const media = hasMedia ? (
    <>
      {photos.length > 0 ? <DetailMediaStage items={photos} /> : null}
      {farm.has_ktp_photo ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Foto KTP
          </p>
          <KtpView id={farm.id} />
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <DetailDialog
      triggerLabel={`Lihat detail kebun ${farm.name}`}
      title="Detail kebun"
      media={media}
    >
      {() => (
        <>
          <DetailIdentity
            title={farm.name}
            badge={
              <Badge variant={farmStatusTone(farm.status)}>{farmStatusLabel(farm.status)}</Badge>
            }
            secondary={`${farm.email} · ${applicantName(farm.applicant)}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Didaftarkan">{formatFarmDate(farm.created_at)}</DetailItem>
            <DetailItem label="Email">{farm.email}</DetailItem>
            <DetailItem label="Pendaftar">{applicantName(farm.applicant)}</DetailItem>
          </DetailSection>

          <DetailSection title="Keputusan">
            <DetailItem label="Disetujui">
              {farm.approved_at ? formatFarmDate(farm.approved_at) : '—'}
            </DetailItem>
            <DetailItem label="Ditolak">
              {farm.rejected_at ? formatFarmDate(farm.rejected_at) : '—'}
            </DetailItem>
            <DetailItem label="Alasan">{farm.status_reason ?? '—'}</DetailItem>
          </DetailSection>
        </>
      )}
    </DetailDialog>
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
        <DetailMediaFrame>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
          <img
            src={state.url}
            alt="Foto KTP"
            className="size-full max-h-[420px] object-contain"
          />
        </DetailMediaFrame>
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

function ApproveFarmDialog({
  id,
  name,
  open,
  onOpenChange,
  onDone
}: {
  id: string;
  name: string;
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
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await approveFarm(id);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success('Kebun disetujui.');
    onDone();
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={changeOpen}
      title={`Setujui pendaftaran ${name}?`}
      description={
        <>
          <span>Pendaftaran disetujui dan petani mendapat akses menjual.</span>
          {error ? (
            <span role="alert" className="mt-2 block font-medium text-destructive-ink">
              {error}
            </span>
          ) : null}
        </>
      }
      confirmLabel="Ya, setujui"
      busyLabel="Memproses…"
      onConfirm={confirm}
    />
  );
}

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(500, 'Alasan maksimal 500 karakter')
});

type RejectData = z.infer<typeof rejectSchema>;

function RejectFarmDialog({
  id,
  name,
  open,
  onOpenChange,
  onDone
}: {
  id: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
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
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: RejectData) {
    if (isSubmitting) return;
    setError(null);
    const result = await rejectFarm(id, data.reason);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success('Kebun ditolak.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Tolak pendaftaran {name}?</DialogTitle>
            <DialogDescription>
              Pendaftaran ditolak dan keputusan ini final. Pendaftar akan membaca alasan di
              bawah ini.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menolak kebun">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`farm-${id}-reject-reason`}
            label="Alasan penolakan"
            hint="Minimal 5 karakter, maksimal 500 karakter."
            error={errors.reason?.message}
            disabled={isSubmitting}
            maxLength={500}
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

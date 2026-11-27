'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Badge,
  Button,
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
  approveTopup,
  getTopupScreenshot,
  rejectTopup,
  type TopupRequest
} from '@/lib/data/topups';
import {
  formatRupiah,
  formatTopupDate,
  topupStatusLabel,
  topupStatusTone
} from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';
import { ConfirmDialog } from './ConfirmDialog';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';

export type TopupQueueProps = {
  pending: TopupRequest[];
  decided: TopupRequest[];
};

export function TopupQueue({ pending, decided }: TopupQueueProps) {
  return (
    <Tabs defaultValue="pending" className="gap-4">
      <TabsList>
        <TabsTrigger value="pending">Menunggu ({pending.length})</TabsTrigger>
        <TabsTrigger value="decided">Sudah diputuskan ({decided.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="grid gap-3">
        {pending.length === 0 ? (
          <AdminEmpty
            title="Tidak ada permintaan top-up yang menunggu"
            description="Permintaan baru muncul di sini setelah pelanggan mengunggah bukti transfer."
          />
        ) : (
          <Table label="Permintaan top-up yang menunggu" minWidth="64rem">
            <TableHeader>
              <TableRow>
                <TableHead>Nominal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((request) => (
                <PendingRow key={request.id} request={request} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="decided" className="grid gap-3">
        {decided.length === 0 ? (
          <AdminEmpty
            title="Belum ada permintaan yang diputuskan"
            description="Top-up yang disetujui atau ditolak muncul di sini."
          />
        ) : (
          <Table label="Permintaan top-up yang sudah diputuskan" minWidth="56rem">
            <TableHeader>
              <TableRow>
                <TableHead>Nominal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Diputuskan oleh</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decided.map((request) => (
                <DecidedRow key={request.id} request={request} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}

function customerName(request: TopupRequest): string {
  const customer = request.customer;
  if (!customer) return '—';
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
  return name || customer.email || '—';
}

function PendingRow({ request }: { request: TopupRequest }) {
  const [busy, setBusy] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium tabular-nums">{formatRupiah(request.amount)}</p>
        <p className="text-muted-foreground">{formatTopupDate(request.created_at)}</p>
      </TableCell>
      <TableCell>{customerName(request)}</TableCell>
      <TableCell>
        <Badge variant={topupStatusTone(request.status)}>
          {topupStatusLabel(request.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <TopupDetail request={request} />
      </TableCell>
      <TableCell>
        <div className="grid gap-3">
          <ApproveForm id={request.id} busy={busy} onBusyChange={setBusy} />
          <RejectForm id={request.id} busy={busy} onBusyChange={setBusy} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function TopupDetail({ request }: { request: TopupRequest }) {
  return (
    <DetailDialog
      triggerLabel={`Lihat detail top-up ${customerName(request)}`}
      title="Detail top-up"
      media={request.has_screenshot ? <ScreenshotView id={request.id} /> : null}
    >
      {() => (
        <>
          <DetailIdentity
            title={`Top-up ${customerName(request)}`}
            badge={
              <Badge variant={topupStatusTone(request.status)}>
                {topupStatusLabel(request.status)}
              </Badge>
            }
            secondary={formatTopupDate(request.created_at)}
          />

          <DetailPricePanel
            label="Nominal top-up"
            value={formatRupiah(request.amount)}
            note={`Diajukan ${formatTopupDate(request.created_at)}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Pelanggan">{customerName(request)}</DetailItem>
            <DetailItem label="Diajukan">{formatTopupDate(request.created_at)}</DetailItem>
            <DetailItem label="Bukti transfer">
              {request.has_screenshot ? 'Ada' : 'Tidak ada'}
            </DetailItem>
          </DetailSection>

          {request.reason || request.reviewed_by ? (
            <DetailSection title="Keputusan">
              {request.reason ? (
                <DetailItem label="Alasan">{request.reason}</DetailItem>
              ) : null}
              {request.reviewed_by ? (
                <DetailItem label="Diputuskan oleh">{request.reviewed_by}</DetailItem>
              ) : null}
            </DetailSection>
          ) : null}
        </>
      )}
    </DetailDialog>
  );
}

function DecidedRow({ request }: { request: TopupRequest }) {
  return (
    <TableRow>
      <TableCell className="font-medium tabular-nums">{formatRupiah(request.amount)}</TableCell>
      <TableCell>{customerName(request)}</TableCell>
      <TableCell>
        <Badge variant={topupStatusTone(request.status)}>
          {topupStatusLabel(request.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatTopupDate(request.created_at)}
      </TableCell>
      <TableCell>{request.reason ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{request.reviewed_by ?? '—'}</TableCell>
      <TableCell>
        <TopupDetail request={request} />
      </TableCell>
    </TableRow>
  );
}

function ScreenshotView({ id }: { id: string }) {
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
    const result = await getTopupScreenshot(id);

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
            alt="Bukti transfer"
            className="size-full max-h-[420px] object-contain"
          />
        </DetailMediaFrame>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Muat ulang bukti
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
          {state.status === 'loading' ? 'Memuat bukti…' : 'Lihat bukti transfer'}
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

const approveSchema = z.object({
  bank_reference: z.string().trim().min(1, 'Masukkan referensi mutasi bank')
});

type ApproveData = z.infer<typeof approveSchema>;

function ApproveForm({
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
  } = useForm<ApproveData>({
    resolver: zodResolver(approveSchema),
    defaultValues: { bank_reference: '' }
  });
  const [pending, setPending] = useState<ApproveData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(data: ApproveData) {
    setPending(data);
    setConfirmOpen(true);
  }

  async function confirm() {
    if (!pending) return;

    onBusyChange(true);
    const result = await approveTopup(id, pending.bank_reference);
    onBusyChange(false);
    setConfirmOpen(false);
    setPending(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Top-up disetujui.');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <FormField
        id={`topup-${id}-reference`}
        label="Referensi mutasi bank"
        hint="Nomor referensi atau keterangan dari mutasi rekening."
        error={errors.bank_reference?.message}
        {...register('bank_reference')}
      />
      <div>
        <Button type="submit" size="sm" disabled={isSubmitting || busy}>
          {isSubmitting ? 'Menyetujui…' : 'Setujui'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Setujui top-up?"
        description="Setujui top-up ini dan tambahkan saldo pelanggan?"
        confirmLabel="Setujui"
        busyLabel="Menyetujui…"
        onConfirm={confirm}
      />
    </form>
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
  const [pending, setPending] = useState<RejectData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(data: RejectData) {
    setPending(data);
    setConfirmOpen(true);
  }

  async function confirm() {
    if (!pending) return;

    onBusyChange(true);
    const result = await rejectTopup(id, pending.reason);
    onBusyChange(false);
    setConfirmOpen(false);
    setPending(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Top-up ditolak.');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <FormField
        id={`topup-${id}-reject-reason`}
        label="Alasan penolakan"
        hint="Pelanggan akan membaca alasan ini."
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div>
        <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting || busy}>
          {isSubmitting ? 'Menolak…' : 'Tolak'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Tolak top-up?"
        description="Tolak top-up ini? Keputusan tidak bisa diubah."
        confirmLabel="Tolak"
        busyLabel="Menolak…"
        destructive
        onConfirm={confirm}
      />
    </form>
  );
}

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
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';
import { RowActions } from './RowActions';

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
  const router = useRouter();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

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
        <div ref={actionsRef} className="inline-flex">
          <RowActions
            label={`Aksi untuk top-up ${customerName(request)}`}
            actions={[
              {
                label: 'Setujui top-up',
                onSelect: () => setApproveOpen(true)
              },
              {
                label: 'Tolak top-up',
                onSelect: () => setRejectOpen(true),
                tone: 'destructive'
              }
            ]}
          />
        </div>

        <ApproveTopupDialog
          request={request}
          open={approveOpen}
          onOpenChange={setApproveOpen}
          onDone={done}
        />
        <RejectTopupDialog
          request={request}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onDone={done}
        />
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

function ApproveTopupDialog({
  request,
  open,
  onOpenChange,
  onDone
}: {
  request: TopupRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
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
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: ApproveData) {
    if (isSubmitting) return;
    setError(null);
    const result = await approveTopup(request.id, data.bank_reference);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success('Top-up disetujui.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>
              Setujui top-up {formatRupiah(request.amount)} dari {customerName(request)}?
            </DialogTitle>
            <DialogDescription>
              Saldo pelanggan bertambah {formatRupiah(request.amount)} setelah disetujui.
              Masukkan referensi mutasi bank sebagai bukti.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menyetujui top-up">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`topup-${request.id}-reference`}
            label="Referensi mutasi bank"
            hint="Nomor referensi atau keterangan dari mutasi rekening."
            error={errors.bank_reference?.message}
            disabled={isSubmitting}
            {...register('bank_reference')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Ya, setujui'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

function RejectTopupDialog({
  request,
  open,
  onOpenChange,
  onDone
}: {
  request: TopupRequest;
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
    const result = await rejectTopup(request.id, data.reason);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success('Top-up ditolak.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>
              Tolak top-up {formatRupiah(request.amount)} dari {customerName(request)}?
            </DialogTitle>
            <DialogDescription>
              Top-up ditolak dan keputusan tidak bisa diubah. Pelanggan akan membaca alasan di
              bawah ini.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menolak top-up">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`topup-${request.id}-reject-reason`}
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

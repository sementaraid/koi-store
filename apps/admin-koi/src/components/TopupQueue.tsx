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

/** Props for {@link TopupQueue}. */
export type TopupQueueProps = {
  /** Requests still waiting on a decision, newest first. */
  pending: TopupRequest[];
  /** Requests already decided (approved and rejected), newest first. */
  decided: TopupRequest[];
};

/**
 * The top-up queue (US-012): pending requests first, each with its transfer
 * screenshot, then a decision form that records the bank reference (approve)
 * or the reason the customer will read (reject).
 *
 * @remarks
 * Decided requests sit in their own tab rather than below the queue: the
 * operator's job is the pending list, and an approved row between two pending
 * ones invites a second approval of the same transfer (AC3).
 */
export function TopupQueue({ pending, decided }: TopupQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permintaan top-up</CardTitle>
        <CardDescription>
          Cocokkan bukti transfer dengan mutasi bank sebelum menyetujui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="gap-4">
          <TabsList>
            <TabsTrigger value="pending">Menunggu ({pending.length})</TabsTrigger>
            <TabsTrigger value="decided">Sudah diputuskan ({decided.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="grid gap-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada permintaan top-up yang menunggu.
              </p>
            ) : (
              pending.map((request) => <PendingRow key={request.id} request={request} />)
            )}
          </TabsContent>

          <TabsContent value="decided" className="grid gap-3">
            {decided.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada permintaan yang diputuskan.
              </p>
            ) : (
              decided.map((request) => <DecidedRow key={request.id} request={request} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** The signed-in customer behind a request, or a dash when the API omitted it. */
function customerName(request: TopupRequest): string {
  const customer = request.customer;
  if (!customer) return '—';
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
  return name || customer.email || '—';
}

/** One pending request: the facts, the screenshot, and the two decisions. */
function PendingRow({ request }: { request: TopupRequest }) {
  /* One decision at a time per row: the two forms are separate, and approving
     while a rejection is on the wire is two answers to one question (AC3). */
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <div className="grid gap-1 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
        <p className="text-base font-medium">{formatRupiah(request.amount)}</p>
        <div className="grid gap-0.5 text-sm">
          <p className="text-muted-foreground">
            {formatTopupDate(request.created_at)} · {customerName(request)}
          </p>
          <div>
            <Badge variant={topupStatusTone(request.status)}>
              {topupStatusLabel(request.status)}
            </Badge>
          </div>
        </div>
      </div>

      {request.has_screenshot ? (
        <ScreenshotView id={request.id} />
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada bukti transfer.</p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ApproveForm id={request.id} busy={busy} onBusyChange={setBusy} />
        <RejectForm id={request.id} busy={busy} onBusyChange={setBusy} />
      </div>
    </div>
  );
}

/** One decided request: its outcome and the reason the customer sees. */
function DecidedRow({ request }: { request: TopupRequest }) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{formatRupiah(request.amount)}</p>
        <Badge variant={topupStatusTone(request.status)}>
          {topupStatusLabel(request.status)}
        </Badge>
      </div>
      <p className="text-muted-foreground">
        {formatTopupDate(request.created_at)} · {customerName(request)}
      </p>
      {request.reason ? <p>Alasan: {request.reason}</p> : null}
      {request.reviewed_by ? (
        <p className="text-xs text-muted-foreground">Diputuskan oleh {request.reviewed_by}</p>
      ) : null}
    </div>
  );
}

/**
 * The transfer screenshot, fetched through the admin-only route (D-018, AC4).
 *
 * @remarks
 * The backend returns bytes, never a URL. They arrive as base64 from the
 * server action and become a blob URL here, revoked when this row unmounts or
 * the operator asks for it again — a 5 MB proof should not sit in memory for
 * the rest of the shift.
 */
function ScreenshotView({ id }: { id: string }) {
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
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
        <img
          src={state.url}
          alt="Bukti transfer"
          className="max-h-96 w-fit max-w-full rounded-md border border-border object-contain"
        />
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

/* Appraising money: the bank statement's reference is required (AC1). */
const approveSchema = z.object({
  bank_reference: z.string().trim().min(1, 'Masukkan referensi mutasi bank')
});

type ApproveData = z.infer<typeof approveSchema>;

/** Approve, with the bank reference that ties the credit to a real transfer. */
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

  async function submit(data: ApproveData) {
    /* Busy before the dialog: a second click while `confirm()` is open is the
       same double approval AC3 forbids. */
    onBusyChange(true);
    if (!confirm('Setujui top-up ini dan tambahkan saldo pelanggan?')) {
      onBusyChange(false);
      return;
    }

    const result = await approveTopup(id, data.bank_reference);
    onBusyChange(false);

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
    </form>
  );
}

/* A rejection is final for the customer, so it needs a reason they can read (AC2). */
const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Masukkan alasan penolakan')
});

type RejectData = z.infer<typeof rejectSchema>;

/** Reject, with the reason the customer will see. Records no transaction. */
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
    if (!confirm('Tolak top-up ini? Keputusan tidak bisa diubah.')) {
      onBusyChange(false);
      return;
    }

    const result = await rejectTopup(id, data.reason);
    onBusyChange(false);

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
    </form>
  );
}

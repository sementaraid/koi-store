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
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from '@koi/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@koi/ui/primitives/tabs';
import { approveClaim, getClaimVideo, rejectClaim, type AdminClaim } from '@/lib/data/claims';
import {
  claimDecisionFailure,
  claimOverdue,
  claimRemedyLabel,
  claimStatusLabel,
  claimStatusTone,
  formatClaimDate
} from '@/lib/helpers/claim-format';
import { activeStrikeLabel, banLabel } from '@/lib/helpers/strike-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailSection
} from './DetailDialog';
import { RowActions, type RowAction } from './RowActions';
import { StrikePanel } from './StrikePanel';

export type ClaimQueueProps = {
  disputed: AdminClaim[];
  disputedTotal: number;
  decided: AdminClaim[];
  now: string;
};

export function ClaimQueue({ disputed, disputedTotal, decided, now }: ClaimQueueProps) {
  return (
    <Tabs defaultValue="disputed" className="gap-4">
      <TabsList>
        <TabsTrigger value="disputed">Sengketa ({disputed.length})</TabsTrigger>
        <TabsTrigger value="decided">Sudah diputuskan ({decided.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="disputed" className="grid gap-3">
        {disputedTotal > disputed.length ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan {disputed.length} dari {disputedTotal} sengketa. Selesaikan yang di
            atas untuk melihat sisanya.
          </p>
        ) : null}
        {disputed.length === 0 ? (
          <AdminEmpty
            title="Tidak ada sengketa menunggu"
            description="Klaim baru muncul di sini setelah pemenang mengajukan sengketa."
          />
        ) : (
          <Table label="Sengketa klaim DOA yang menunggu" minWidth="72rem">
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Keputusan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputed.map((claim) => (
                <DisputedRow key={claim.id} claim={claim} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="decided" className="grid gap-3">
        {decided.length === 0 ? (
          <AdminEmpty
            title="Belum ada klaim yang diputuskan"
            description="Klaim yang disetujui atau ditolak muncul di sini."
          />
        ) : (
          <Table label="Klaim DOA yang sudah diputuskan" minWidth="72rem">
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keputusan</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Strike</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decided.map((claim) => (
                <DecidedRow key={claim.id} claim={claim} now={now} />
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ClaimLot({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-1">
      <p className="font-medium">{claim.product.title ?? 'Lot tanpa judul'}</p>
      <p className="text-muted-foreground">
        {claim.seller.name || '—'} · Pemenang: {claim.winner.name || '—'}
      </p>
      <p className="text-muted-foreground">Dibuka {formatClaimDate(claim.opened_at)}</p>
    </div>
  );
}

function ClaimStatus({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={claimStatusTone(claim.status)}>{claimStatusLabel(claim.status)}</Badge>
        <span className="text-sm text-muted-foreground">{claimRemedyLabel(claim.remedy)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={claim.active_strikes >= 2 ? 'urgent' : 'muted'}>
          {activeStrikeLabel(claim.active_strikes)}
        </Badge>
        <Badge variant={claim.banned ? 'urgent' : 'neutral'}>{banLabel(claim.banned)}</Badge>
      </div>
    </div>
  );
}

function DisputedRow({ claim }: { claim: AdminClaim }) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const actions: RowAction[] = [
    { label: 'Setujui', onSelect: () => setDecision('approve') },
    { label: 'Tolak', tone: 'destructive', onSelect: () => setDecision('reject') }
  ];

  return (
    <TableRow>
      <TableCell>
        <ClaimLot claim={claim} />
      </TableCell>
      <TableCell>
        <ClaimStatus claim={claim} />
      </TableCell>
      <TableCell>
        <ClaimDetail claim={claim} />
      </TableCell>
      <TableCell>
        <div ref={triggerRef} className="inline-flex">
          <RowActions
            label={`Aksi klaim ${claim.product.title ?? claim.id}`}
            actions={actions}
          />
        </div>
        {decision ? (
          <DecisionDialog
            claim={claim}
            decision={decision}
            open
            onOpenChange={(open) => {
              if (!open) setDecision(null);
            }}
            finalFocus={() => triggerRef.current?.querySelector('button') ?? null}
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function ClaimDetail({ claim, now }: { claim: AdminClaim; now?: string }) {
  const deadline =
    now && claim.status === 'approved' ? claimOverdue(claim.approved_at, now) : null;

  return (
    <DetailDialog
      triggerLabel={`Lihat detail klaim ${claim.product.title ?? claim.id}`}
      title="Detail klaim"
      media={claim.has_video ? <VideoView id={claim.id} /> : null}
    >
      {() => (
        <>
          <DetailIdentity
            title={claim.product.title ?? 'Lot tanpa judul'}
            badge={
              <Badge variant={claimStatusTone(claim.status)}>
                {claimStatusLabel(claim.status)}
              </Badge>
            }
            secondary={`${claim.seller.name || '—'} · Pemenang ${claim.winner.name || '—'}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Penjual">{claim.seller.name || '—'}</DetailItem>
            <DetailItem label="Pemenang">{claim.winner.name || '—'}</DetailItem>
            <DetailItem label="Dibuka">{formatClaimDate(claim.opened_at)}</DetailItem>
            <DetailItem label="Ganti rugi">{claimRemedyLabel(claim.remedy)}</DetailItem>
            <DetailItem label="Strike aktif">{activeStrikeLabel(claim.active_strikes)}</DetailItem>
            <DetailItem label="Blokir">{banLabel(claim.banned)}</DetailItem>
            <DetailItem label="Video unboxing">
              {claim.has_video ? 'Ada' : 'Tidak ada'}
            </DetailItem>
          </DetailSection>

          {claim.approved_at || claim.decided_at || claim.decision_reason ? (
            <DetailSection title="Keputusan">
              {claim.approved_at ? (
                <DetailItem label="Disetujui">{formatClaimDate(claim.approved_at)}</DetailItem>
              ) : null}
              {deadline?.label ? (
                <DetailItem label="Batas kirim ulang">{deadline.label}</DetailItem>
              ) : null}
              {claim.decided_at ? (
                <DetailItem label="Diputuskan">{formatClaimDate(claim.decided_at)}</DetailItem>
              ) : null}
              {claim.decision_reason ? (
                <DetailItem label="Alasan">{claim.decision_reason}</DetailItem>
              ) : null}
            </DetailSection>
          ) : null}
        </>
      )}
    </DetailDialog>
  );
}

function DecidedRow({ claim, now }: { claim: AdminClaim; now: string }) {
  const deadline = claim.status === 'approved' ? claimOverdue(claim.approved_at, now) : null;

  return (
    <TableRow>
      <TableCell>
        <ClaimLot claim={claim} />
      </TableCell>
      <TableCell>
        <ClaimStatus claim={claim} />
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          {claim.status === 'approved' && claim.approved_at ? (
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Disetujui {formatClaimDate(claim.approved_at)}
                </span>
                {deadline && deadline.label ? (
                  <Badge variant={deadline.overdue ? 'attention' : 'muted'}>
                    {deadline.label}
                  </Badge>
                ) : null}
              </div>
              {deadline?.overdue ? (
                <p className="text-xs text-muted-foreground">
                  Petani melewati batas 3 hari dan menjadi layak menerima strike.
                </p>
              ) : null}
            </div>
          ) : null}
          {claim.decision_reason ? <p>Alasan: {claim.decision_reason}</p> : null}
          {claim.decided_at ? (
            <p className="text-xs text-muted-foreground">
              Diputuskan {formatClaimDate(claim.decided_at)}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <ClaimDetail claim={claim} now={now} />
      </TableCell>
      <TableCell>
        {claim.status === 'approved' ? (
          <StrikePanel
            defaultReasonType="farmer_claim_refused"
            customerId={claim.seller.customer_id}
            target={
              claim.seller.customer_id
                ? { customer_id: claim.seller.customer_id }
                : { seller_id: claim.seller.id }
            }
            idPrefix={`claim-${claim.id}`}
            targetName={claim.seller.name || undefined}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

const DECISION_SCHEMA = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(500, 'Alasan maksimal 500 karakter')
});

type DecisionData = z.infer<typeof DECISION_SCHEMA>;

/* The dialog carries the consequence and the required reason, so pressing
   "Ya, setujui" or "Ya, tolak" is the confirmation. */
function DecisionDialog({
  claim,
  decision,
  open,
  onOpenChange,
  finalFocus
}: {
  claim: AdminClaim;
  decision: 'approve' | 'reject';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DecisionData>({
    resolver: zodResolver(DECISION_SCHEMA),
    defaultValues: { reason: '' }
  });
  const label = claim.product.title ?? 'lot ini';
  const approve = decision === 'approve';
  const uid = `claim-${claim.id}-${decision}`;

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setApiError(null);
      reset();
    }
  }

  async function submit(data: DecisionData) {
    if (isSubmitting) return;
    setApiError(null);
    const result = approve
      ? await approveClaim(claim.id, data.reason)
      : await rejectClaim(claim.id, data.reason);

    if (!result.success) {
      setApiError(claimDecisionFailure(result.status, result.error).message);
      return;
    }

    toast.success(approve ? 'Klaim disetujui.' : 'Klaim ditolak.');
    onOpenChange(false);
    reset();
    router.refresh();
  }

  const error = errors.reason?.message;
  const describedBy = error ? `${uid}-hint ${uid}-error` : `${uid}-hint`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={!isSubmitting} finalFocus={finalFocus}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>
              {approve ? `Setujui klaim ${label}?` : `Tolak klaim ${label}?`}
            </DialogTitle>
            <DialogDescription>
              {approve
                ? 'Klaim disetujui dan keputusan ini final. Pemenang mengirim ulang koi atau menerima ganti rugi sesuai remedi.'
                : 'Klaim ditolak dan keputusan ini final. Petani bisa menerima strike bila klaim yang disetujui tidak dipenuhi.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`${uid}-reason`}>Alasan keputusan</Label>
            <Textarea
              id={`${uid}-reason`}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              {...register('reason')}
            />
            <p id={`${uid}-hint`} className="text-xs text-muted-foreground">
              Wajib diisi, 5–500 karakter. Tersimpan bersama keputusan ini sebagai catatan
              audit.
            </p>
            {error ? (
              <p id={`${uid}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal memutuskan klaim">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" variant={approve ? 'solid' : 'destructive'} disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : approve ? 'Ya, setujui' : 'Ya, tolak'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VideoView({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; url: string; contentType: string }
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
    const result = await getClaimVideo(id);

    if ('error' in result) {
      setState({ status: 'error', message: result.error });
      return;
    }

    const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
    const next = URL.createObjectURL(new Blob([bytes], { type: result.contentType }));
    setUrl(next);
    setState({ status: 'ready', url: next, contentType: result.contentType });
  }

  if (state.status === 'ready') {
    return (
      <div className="grid gap-2">
        <DetailMediaFrame>
          <video
            src={state.url}
            aria-label="Video unboxing klaim"
            controls
            playsInline
            preload="metadata"
            className="size-full max-h-[420px] object-contain"
          >
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </DetailMediaFrame>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Muat ulang video
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
          {state.status === 'loading' ? 'Memuat video…' : 'Lihat video unboxing'}
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

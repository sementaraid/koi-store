'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { ConfirmDialog } from './ConfirmDialog';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaFrame,
  DetailSection
} from './DetailDialog';
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
        <DecisionForm id={claim.id} />
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
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function DecisionForm({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null);

  function decide(decision: 'approve' | 'reject') {
    if (!reason.trim()) {
      setError('Masukkan alasan keputusan');
      return;
    }
    setPendingDecision(decision);
  }

  async function confirmDecision() {
    const decision = pendingDecision;
    if (!decision) return;

    const trimmed = reason.trim();
    setBusy(true);
    setError(null);
    const result =
      decision === 'approve' ? await approveClaim(id, trimmed) : await rejectClaim(id, trimmed);
    setBusy(false);
    setPendingDecision(null);

    if (result.success) {
      toast.success(decision === 'approve' ? 'Klaim disetujui.' : 'Klaim ditolak.');
      router.refresh();
      return;
    }

    const info = claimDecisionFailure(result.status, result.error);
    setError(info.message);
    toast.error(info.message);
    if (info.refresh) router.refresh();
  }

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="grid gap-2"
      noValidate
    >
      <FormField
        id={`claim-${id}-reason`}
        label="Alasan keputusan"
        hint="Tersimpan bersama keputusan ini dan menjadi catatan audit."
        value={reason}
        error={error ?? undefined}
        onChange={(event) => {
          setReason(event.target.value);
          if (error) setError(null);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => decide('approve')}>
          {busy ? 'Memproses…' : 'Setujui'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() => decide('reject')}
        >
          Tolak
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDecision !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null);
        }}
        title={pendingDecision === 'approve' ? 'Setujui klaim?' : 'Tolak klaim?'}
        description={
          pendingDecision === 'approve'
            ? 'Setujui klaim ini? Keputusan bersifat final.'
            : 'Tolak klaim ini? Keputusan bersifat final.'
        }
        confirmLabel={pendingDecision === 'approve' ? 'Setujui' : 'Tolak'}
        busyLabel="Memproses…"
        destructive={pendingDecision === 'reject'}
        onConfirm={confirmDecision}
      />
    </form>
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

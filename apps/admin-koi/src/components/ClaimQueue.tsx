'use client';

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
  FormField
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
import { StrikePanel } from './StrikePanel';

export type ClaimQueueProps = {
  disputed: AdminClaim[];
  disputedTotal: number;
  decided: AdminClaim[];
  now: string;
};

export function ClaimQueue({ disputed, disputedTotal, decided, now }: ClaimQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Klaim DOA</CardTitle>
        <CardDescription>
          Tinjau video unboxing dari pemenang sebelum memutuskan sengketa.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              disputed.map((claim) => <DisputedRow key={claim.id} claim={claim} />)
            )}
          </TabsContent>

          <TabsContent value="decided" className="grid gap-3">
            {decided.length === 0 ? (
              <AdminEmpty
                title="Belum ada klaim yang diputuskan"
                description="Klaim yang disetujui atau ditolak muncul di sini."
              />
            ) : (
              decided.map((claim) => <DecidedRow key={claim.id} claim={claim} now={now} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ClaimFacts({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
        <p className="text-base font-medium">{claim.product.title ?? 'Lot tanpa judul'}</p>
        <div className="grid gap-0.5 text-sm">
          <p className="text-muted-foreground">
            {claim.seller.name || '—'} · Pemenang: {claim.winner.name || '—'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={claimStatusTone(claim.status)}>
              {claimStatusLabel(claim.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">{claimRemedyLabel(claim.remedy)}</span>
            <Badge variant={claim.active_strikes >= 2 ? 'urgent' : 'muted'}>
              {activeStrikeLabel(claim.active_strikes)}
            </Badge>
            <Badge variant={claim.banned ? 'urgent' : 'neutral'}>{banLabel(claim.banned)}</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Dibuka {formatClaimDate(claim.opened_at)}</p>

      {claim.has_video ? (
        <VideoView id={claim.id} />
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada video unboxing.</p>
      )}
    </div>
  );
}

function DisputedRow({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <ClaimFacts claim={claim} />
      <DecisionForm id={claim.id} />
    </div>
  );
}

function DecidedRow({ claim, now }: { claim: AdminClaim; now: string }) {
  const deadline = claim.status === 'approved' ? claimOverdue(claim.approved_at, now) : null;

  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <ClaimFacts claim={claim} />
      {claim.status === 'approved' && claim.approved_at ? (
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Disetujui {formatClaimDate(claim.approved_at)}
            </span>
            {deadline && deadline.label ? (
              <Badge variant={deadline.overdue ? 'attention' : 'muted'}>{deadline.label}</Badge>
            ) : null}
          </div>
          {deadline?.overdue ? (
            <p className="text-xs text-muted-foreground">
              Petani melewati batas 3 hari dan menjadi layak menerima strike.
            </p>
          ) : null}
        </div>
      ) : null}
      {claim.decision_reason ? (
        <p className="text-sm">Alasan: {claim.decision_reason}</p>
      ) : null}
      {claim.decided_at ? (
        <p className="text-xs text-muted-foreground">
          Diputuskan {formatClaimDate(claim.decided_at)}
        </p>
      ) : null}
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
      ) : null}
    </div>
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
        <video
          src={state.url}
          controls
          preload="metadata"
          className="max-h-96 w-fit max-w-full rounded-md border border-border"
        >
          Browser Anda tidak mendukung pemutaran video.
        </video>
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

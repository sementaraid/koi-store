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

import { StrikePanel } from './StrikePanel';

/** Props for {@link ClaimQueue}. */
export type ClaimQueueProps = {
  /** Disputed claims, oldest first. */
  disputed: AdminClaim[];
  /** How many disputed in total; may exceed `disputed.length`. */
  disputedTotal: number;
  /** Approved and rejected claims, oldest first. */
  decided: AdminClaim[];
  /** The server's clock as ISO, so both renders compute the same deadline. */
  now: string;
};

/**
 * The `/klaim` queue (US-054 AC3, US-055 AC2; US-059 T-059.2): disputes first,
 * each with the lot, the farm, the winner and the unboxing video, then the
 * decisions already taken.
 *
 * @remarks
 * Only `disputed` claims carry a decision form. The decision is final
 * (D-038), so the reason is required and the confirm copy says so; a decided
 * claim sits in its own tab so it cannot be decided twice. An approved claim
 * is also where the admin gives a `farmer_claim_refused` strike, off the row's
 * own `seller`.
 */
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
              <p className="text-sm text-muted-foreground">Tidak ada sengketa menunggu.</p>
            ) : (
              disputed.map((claim) => <DisputedRow key={claim.id} claim={claim} />)
            )}
          </TabsContent>

          <TabsContent value="decided" className="grid gap-3">
            {decided.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada klaim yang diputuskan.</p>
            ) : (
              decided.map((claim) => <DecidedRow key={claim.id} claim={claim} now={now} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** The lot, the farm, the winner and the video — shared by both tabs. */
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

/** One disputed claim: the facts, the video, and the two final decisions. */
function DisputedRow({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <ClaimFacts claim={claim} />
      <DecisionForm id={claim.id} />
    </div>
  );
}

/** One decided claim: the facts and the reason the decision was taken. */
function DecidedRow({ claim, now }: { claim: AdminClaim; now: string }) {
  /* US-056 AC2: only an `approved` claim has a running 3-day clock. A missed
     deadline makes the farmer strike-eligible; the strike itself is US-059. */
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
      {/* US-059 T-059.2: refusing an approved claim is what earns this strike. */}
      {claim.status === 'approved' ? (
        <StrikePanel
          defaultReasonType="farmer_claim_refused"
          customerId={claim.seller.customer_id}
          target={
            claim.seller.customer_id
              ? { customer_id: claim.seller.customer_id }
              : { seller_id: claim.seller.id }
          }
        />
      ) : null}
    </div>
  );
}

/**
 * The admin's decision (US-055 AC2): a written reason, then approve or reject.
 *
 * @remarks
 * Both buttons share the one reason field; one decision at a time, and the
 * resulting status comes from the server (a refresh re-reads it), never from an
 * optimistic flip. A 409/404 refreshes the queue (`claimDecisionFailure`)
 * because the row is stale.
 */
function DecisionForm({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function decide(decision: 'approve' | 'reject') {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Masukkan alasan keputusan');
      return;
    }
    const confirmed =
      decision === 'approve'
        ? confirm('Setujui klaim ini? Keputusan bersifat final.')
        : confirm('Tolak klaim ini? Keputusan bersifat final.');
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    const result =
      decision === 'approve' ? await approveClaim(id, trimmed) : await rejectClaim(id, trimmed);
    setBusy(false);

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
    </form>
  );
}

/**
 * The unboxing video, fetched through the admin-only route (D-018).
 *
 * @remarks
 * Bytes, never a URL: they arrive as base64 from the server action and become
 * a blob URL here, revoked when this row unmounts or the operator loads it
 * again — an unboxing video should not sit in memory for the rest of the shift.
 */
function VideoView({ id }: { id: string }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; url: string; contentType: string }
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

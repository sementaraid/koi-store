'use client';

import { useEffect, useState } from 'react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { getClaimVideo, type AdminClaim } from '@/lib/data/claims';
import {
  claimRemedyLabel,
  claimStatusLabel,
  claimStatusTone,
  formatClaimDate
} from '@/lib/helpers/claim-format';

/** Props for {@link ClaimQueue}. */
export type ClaimQueueProps = {
  /** Open claims, oldest first. */
  claims: AdminClaim[];
  /** How many are open in total; may exceed `claims.length`. */
  total: number;
};

/**
 * The `/klaim` queue (US-054 AC3): every open dead-on-arrival claim with the
 * lot, the farm, the winner and the unboxing video.
 *
 * @remarks
 * Read-only on purpose: US-055 brings the decision actions. There is no
 * "decided" tab because the route filters to `open` — a decided claim leaves
 * this list by its status.
 */
export function ClaimQueue({ claims, total }: ClaimQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Klaim DOA ({total})</CardTitle>
        <CardDescription>
          Tinjau video unboxing dari pemenang sebelum memutuskan sengketa.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {total > claims.length ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan {claims.length} dari {total} klaim. Selesaikan yang di atas untuk
            melihat sisanya.
          </p>
        ) : null}
        {claims.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada klaim DOA.</p>
        ) : (
          claims.map((claim) => <ClaimRow key={claim.id} claim={claim} />)
        )}
      </CardContent>
    </Card>
  );
}

/** One open claim: the lot, the farm, the winner, and the video. */
function ClaimRow({ claim }: { claim: AdminClaim }) {
  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
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

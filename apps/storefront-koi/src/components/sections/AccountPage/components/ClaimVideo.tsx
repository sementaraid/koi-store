'use client';

import { useEffect, useState } from 'react';

import { Button } from '@koi/ui';
import { getClaimVideo } from '@/lib/data/claims';

/** Props for {@link ClaimVideo}. */
export type ClaimVideoProps = {
  claimId: string;
};

/**
 * One claim's unboxing video (US-054 T-054.2c, AC3, D-018).
 *
 * @remarks
 * The backend returns bytes, never a URL. They arrive as base64 from the
 * server action and become a blob URL here, revoked when this row unmounts or
 * the farmer asks for it again — a private clip should not sit in memory for
 * the rest of the shift.
 */
export function ClaimVideo({ claimId }: ClaimVideoProps) {
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
    const result = await getClaimVideo(claimId);

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
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the farmer's own evidence clip */}
        <video
          src={state.url}
          controls
          className="max-h-96 w-fit max-w-full rounded-md border border-border"
        />
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

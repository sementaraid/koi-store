'use client';

import { useEffect } from 'react';

import { Button } from '@koi/ui';
import { CONTAINER } from '@/const/layout';

// The lot fetch failed (a backend error, not a 404, which keeps the real
// not-found page). Offer a retry instead of Next's default error screen.
export default function LotError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`${CONTAINER} py-16`}>
      <div
        role="alert"
        className="mx-auto flex max-w-lg flex-col items-start gap-3 rounded-control border border-border bg-card p-6"
      >
        <h1 className="font-heading text-xl font-bold">Lot tidak dapat dimuat</h1>
        <p className="text-sm text-muted-foreground">
          Data lot sedang tidak tersedia. Coba lagi sebentar lagi.
        </p>
        <Button type="button" onClick={reset}>
          Coba lagi
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

import { Button } from '@koi/ui';

/* The clipboard button plus the live region that tells a screen reader
   "Tersalin" without moving focus. Extracted from PaymentInstructions (T-108.4)
   so the top-up bank details copy the same way instead of a second clipboard
   implementation drifting from the first. */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      window.setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('failed');
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={copy}
        aria-label={`Salin ${label}`}
      >
        Salin
      </Button>
      <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {state === 'copied' ? 'Tersalin' : state === 'failed' ? 'Gagal menyalin' : ''}
      </span>
    </span>
  );
}

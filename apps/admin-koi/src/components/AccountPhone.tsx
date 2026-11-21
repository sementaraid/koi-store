'use client';

import { useState } from 'react';

import { Button } from '@koi/ui';
import { revealAccountPhone } from '@/lib/data/accounts';

type State =
  | { status: 'masked' }
  | { status: 'loading' }
  | { status: 'revealed'; value: string | null }
  | { status: 'error'; message: string };

// US-070 T-070.2b (D-042): the masked phone with a click-to-reveal. One click
// is one backend call, which writes exactly one audit row. A refresh mounts
// this component again in the masked state.
export function AccountPhone({ id, masked }: { id: string; masked: string | null }) {
  const [state, setState] = useState<State>({ status: 'masked' });

  async function reveal() {
    setState({ status: 'loading' });
    const result = await revealAccountPhone(id);
    setState('error' in result ? { status: 'error', message: result.error } : { status: 'revealed', value: result.value });
  }

  if (!masked) {
    return <span className="text-muted-foreground">Tidak ada nomor telepon</span>;
  }

  if (state.status === 'revealed') {
    return <span>{state.value ?? 'Tidak ada nomor telepon'}</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{masked}</span>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={state.status === 'loading'}
        onClick={reveal}
      >
        {state.status === 'loading' ? 'Menampilkan…' : 'Tampilkan'}
      </Button>
      {state.status === 'error' ? (
        <span role="alert" className="text-xs text-destructive-ink">
          {state.message}
        </span>
      ) : null}
    </span>
  );
}

'use client';

import { useState } from 'react';

import { Button } from '@koi/ui';
import { revealWonLotBank, type WonLotSellerBank } from '@/lib/data/lots';

export type RevealBankProps = {
  lotId: string;
  details: WonLotSellerBank | null;
};

export function RevealBank({ lotId, details }: RevealBankProps) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'shown'; value: WonLotSellerBank }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  if (!details) {
    return <p className="text-sm text-muted-foreground">Rekening bank peternak belum diisi</p>;
  }

  async function reveal() {
    setState({ status: 'loading' });
    const result = await revealWonLotBank(lotId);
    setState(
      'error' in result
        ? { status: 'error', message: result.error }
        : { status: 'shown', value: result.value }
    );
  }

  if (state.status === 'shown') {
    return (
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">
          Rekening {state.value.bank_name ?? 'peternak'}
        </p>
        <p className="text-sm text-foreground">
          {state.value.holder_name} ·{' '}
          <span className="font-mono">{state.value.account_number}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Pembukaan rekening ini tercatat di sistem.
        </p>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setState({ status: 'idle' })}
          >
            Sembunyikan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <p className="text-sm text-muted-foreground">
        {details.bank_name ? `Rekening ${details.bank_name}` : 'Rekening bank peternak'}
      </p>
      <p className="text-sm text-muted-foreground">
        {details.holder_name ?? '—'} ·{' '}
        <span className="font-mono">{details.account_number ?? '—'}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={reveal}
          disabled={state.status === 'loading'}
          aria-label="Tampilkan rekening bank peternak lengkap"
        >
          {state.status === 'loading' ? 'Memuat…' : 'Tampilkan rekening'}
        </Button>
        {state.status === 'error' ? (
          <span role="alert" className="text-xs text-destructive-ink">
            {state.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

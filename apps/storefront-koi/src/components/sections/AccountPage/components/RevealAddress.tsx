'use client';

import { useState } from 'react';

import { Button } from '@koi/ui';
import { revealSoldLotAddress } from '@/lib/data/sold-lots';
import {
  fullAddressLines,
  maskedAddressLabel,
  type FullAddress,
  type MaskedAddress
} from '@/lib/helpers/sold-lot';

export type RevealAddressProps = {
  lotId: string;
  address: MaskedAddress | null;
};

export function RevealAddress({ lotId, address }: RevealAddressProps) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'shown'; value: FullAddress }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  if (!address) {
    return <p className="text-sm text-muted-foreground">Alamat belum diisi</p>;
  }

  async function reveal() {
    setState({ status: 'loading' });
    const result = await revealSoldLotAddress(lotId);
    setState(
      'error' in result
        ? { status: 'error', message: result.error }
        : { status: 'shown', value: result.value }
    );
  }

  if (state.status === 'shown') {
    const lines = fullAddressLines(state.value);
    return (
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">Alamat lengkap</p>
        <address className="text-sm text-muted-foreground not-italic">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
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
      <p className="text-sm text-muted-foreground">{maskedAddressLabel(address)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={reveal}
          disabled={state.status === 'loading'}
          aria-label="Tampilkan alamat lengkap pemenang"
        >
          {state.status === 'loading' ? 'Memuat…' : 'Tampilkan alamat'}
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

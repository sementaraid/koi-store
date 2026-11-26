'use client';

import { useState } from 'react';

import { Button } from '@koi/ui';
import { ArrivalProof } from '@/components/molecules/ArrivalProof/ArrivalProof';
import {
  WonLotPanel,
  type WonLotPanelProps
} from '@/components/sections/LotDetailsPage/components/WonLotPanel';
import { claimWindowInfo } from '@/lib/helpers/claim';

// US-101 AC7: the Bid Saya won card offers the same delivery and claim actions
// as the lot page, through the same component and server actions, so the two
// views can't drift. Only the opening differs: the claim form sits behind
// `Laporkan` on the card instead of staying open.
// The lot page keeps WonLotPanel's own box. On the Bid Saya card the panel is
// the card's action footer, so the box is flattened and only its top edge stays
// as the divider before the actions.
const PANEL_FOOTER =
  '[&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-b-0 [&>div]:border-border [&>div]:bg-transparent [&>div]:px-0 [&>div]:pt-4 [&>div]:pb-0';

export function WonLotActions(props: WonLotPanelProps) {
  const [claimOpen, setClaimOpen] = useState(false);

  const claimable =
    props.status === 'delivered' &&
    !props.claim &&
    claimWindowInfo(props.claimWindowEndsAt, props.now).open;

  if (!claimable || claimOpen) {
    return (
      <div className={PANEL_FOOTER}>
        <WonLotPanel {...props} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-t border-border pt-4">
      {/* US-110 AC2: on a delivered lot inside the claim window the full panel
          stays behind `Laporkan`, but the arrival proof must stay reachable. */}
      <ArrivalProof lotId={props.lotId} proof={props.arrivalProof} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setClaimOpen(true)}>
          Laporkan
        </Button>
        <span className="text-xs text-muted-foreground">
          Koi tidak sesuai? Rekam video unboxing sebelum melapor.
        </span>
      </div>
    </div>
  );
}

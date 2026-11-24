import type { BidStanding } from './bid-status.ts';
import { joinFeeLabel, type JoinControlState } from './join-auction.ts';
import type { BidControlState } from './place-bid.ts';

export type LotBarActionKind =
  | 'sign-in'
  | 'join'
  | 'bid'
  | 'highest'
  | 'waiting'
  | 'none';

export type LotBarAction = {
  kind: LotBarActionKind;
  label: string;
  disabled?: boolean;
};

// US-099 AC11: one primary action for the mobile bar, chosen from the same
// state the page's join and bid surfaces read. A farmer's own auction gets no
// action (AC12), and a joined viewer who is highest gets a status, not a bid.
export function lotBarAction(input: {
  joinMode?: JoinControlState;
  fee?: number;
  bidMode?: BidControlState;
  standing: BidStanding;
}): LotBarAction {
  if (!input.joinMode || input.joinMode === 'owner' || input.joinMode === 'unknown') {
    return { kind: 'none', label: '' };
  }

  if (input.joinMode === 'signed-out') {
    return { kind: 'sign-in', label: 'Masuk untuk ikut lelang' };
  }

  if (input.joinMode === 'join') {
    return { kind: 'join', label: joinFeeLabel(input.fee ?? 0) };
  }

  if (input.bidMode === 'waiting') {
    return { kind: 'waiting', label: 'Menunggu lelang dimulai', disabled: true };
  }

  if (input.standing === 'highest') {
    return { kind: 'highest', label: 'Anda tertinggi' };
  }

  return { kind: 'bid', label: 'Pasang Bid' };
}

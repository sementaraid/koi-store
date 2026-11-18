
export type AuctionStatus =
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'live'
  | 'closed'
  | 'cancelled';

export const AUCTION_STATUSES: AuctionStatus[] = [
  'draft',
  'pending_approval',
  'scheduled',
  'live',
  'closed',
  'cancelled'
];

export function isAuctionStatus(value: string | string[] | undefined): value is AuctionStatus {
  return typeof value === 'string' && (AUCTION_STATUSES as readonly string[]).includes(value);
}

export type AuctionStatusTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention' | 'live';

const LABELS: Record<AuctionStatus, { label: string; tone: AuctionStatusTone }> = {
  draft: { label: 'Draf', tone: 'neutral' },
  pending_approval: { label: 'Menunggu persetujuan', tone: 'info' },
  scheduled: { label: 'Terjadwal', tone: 'attention' },
  live: { label: 'Live', tone: 'live' },
  closed: { label: 'Selesai', tone: 'muted' },
  cancelled: { label: 'Dibatalkan', tone: 'muted' }
};

export function auctionStatusLabel(status: string): { label: string; tone: AuctionStatusTone } {
  return LABELS[status as AuctionStatus] ?? { label: status, tone: 'neutral' };
}

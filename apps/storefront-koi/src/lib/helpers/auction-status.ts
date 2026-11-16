/* An auction's status, in the house's Indonesian (US-030 AC8, status enum from
   `packages/api/src/modules/auction/models/auction.ts`:
   `draft | pending_approval | scheduled | live | closed | cancelled`). */

export type AuctionStatus =
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'live'
  | 'closed'
  | 'cancelled';

/** D-031's enum, in reading order. The one tracker tab list and the one
    `?status=` value set both read off this, so a status can't drift between
    the two. */
export const AUCTION_STATUSES: AuctionStatus[] = [
  'draft',
  'pending_approval',
  'scheduled',
  'live',
  'closed',
  'cancelled'
];

/** Whether a `?status=` query value is one of D-031's six — never trusts a
    hand-typed URL param as a status to send the server. */
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

/** The label and `Badge` tone for one auction's status. An unknown status
    still reads, rather than throwing on a value this file hasn't heard of. */
export function auctionStatusLabel(status: string): { label: string; tone: AuctionStatusTone } {
  return LABELS[status as AuctionStatus] ?? { label: status, tone: 'neutral' };
}

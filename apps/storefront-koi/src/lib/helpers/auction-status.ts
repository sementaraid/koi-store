/* An auction's status, in the house's Indonesian (US-030 AC8, status enum from
   `packages/api/src/modules/auction/models/auction.ts`:
   `draft | pending_approval | scheduled | live | closed | cancelled`). */

export type AuctionStatusTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention' | 'live';

const LABELS: Record<string, { label: string; tone: AuctionStatusTone }> = {
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
  return LABELS[status] ?? { label: status, tone: 'neutral' };
}

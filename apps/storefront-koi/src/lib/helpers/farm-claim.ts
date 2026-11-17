/* US-054 T-054.2c (AC3): how a claim reads on the farmer's sold-lot row —
   the badge, its tone, and the open time in Jakarta's clock. Pure, so the
   labels can be tested without a browser. */

/** A `Badge` tone, as `@koi/ui` names them. */
export type FarmerClaimTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention';

const STATUS: Record<string, { label: string; tone: FarmerClaimTone }> = {
  open: { label: 'Klaim masuk', tone: 'attention' },
  approved: { label: 'Disetujui', tone: 'info' },
  disputed: { label: 'Disengketakan', tone: 'urgent' },
  rejected: { label: 'Ditolak', tone: 'muted' },
  resolved: { label: 'Menunggu konfirmasi', tone: 'muted' },
  confirmed: { label: 'Selesai', tone: 'info' }
};

/** Label and tone for one claim's status on the farmer's row. An unknown
    status reads as itself rather than throwing. */
export function farmerClaimStatus(status: string): { label: string; tone: FarmerClaimTone } {
  return STATUS[status] ?? { label: status, tone: 'neutral' };
}

/** When the claim was opened, in Jakarta time like every other house
    timestamp (`formatDeadline` pins the same zone). */
export function formatClaimOpenedAt(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

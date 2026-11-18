import type { ReportStatus } from '../data/reports.ts';

/** The one report state's Indonesian label (US-058). */
const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Terbuka'
};

/** Indonesian label for a report's status, for the queue's badge. */
export function reportStatusLabel(status: ReportStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** One timestamp in Jakarta time, like every other admin timestamp. */
function formatJakarta(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

/** When the farmer reported it, in Jakarta time (US-058 T-058.4). */
export function formatReportedAt(iso: string): string {
  return formatJakarta(iso);
}

/** The winner's payment deadline (D-058: the lot's `closed_at` + 24 h), in
    Jakarta time. A lot without `closed_at` carries no deadline, never a guess. */
export function reportDeadlineLabel(payBy: string | null): string {
  return payBy ? `Batas bayar ${formatJakarta(payBy)}` : 'Batas bayar tidak tercatat';
}

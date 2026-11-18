import type { ReportStatus } from '../data/reports.ts';

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Terbuka'
};

export function reportStatusLabel(status: ReportStatus): string {
  return STATUS_LABEL[status] ?? status;
}

function formatJakarta(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

export function formatReportedAt(iso: string): string {
  return formatJakarta(iso);
}

export function reportDeadlineLabel(payBy: string | null): string {
  return payBy ? `Batas bayar ${formatJakarta(payBy)}` : 'Batas bayar tidak tercatat';
}

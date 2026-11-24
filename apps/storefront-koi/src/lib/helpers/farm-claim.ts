import { wibClock, wibDayMonth, wibParts } from './wib.ts';

export type FarmerClaimTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention';

const STATUS: Record<string, { label: string; tone: FarmerClaimTone }> = {
  open: { label: 'Klaim masuk', tone: 'attention' },
  approved: { label: 'Disetujui', tone: 'info' },
  disputed: { label: 'Disengketakan', tone: 'urgent' },
  rejected: { label: 'Ditolak', tone: 'muted' },
  resolved: { label: 'Menunggu konfirmasi', tone: 'muted' },
  confirmed: { label: 'Selesai', tone: 'info' }
};

export function farmerClaimStatus(status: string): { label: string; tone: FarmerClaimTone } {
  return STATUS[status] ?? { label: status, tone: 'neutral' };
}

export function formatClaimOpenedAt(iso: string): string {
  const at = Date.parse(iso);
  return `${wibDayMonth(at)} ${wibParts(at).year}, ${wibClock(at)}`;
}

export type ClaimDecisionFailure = {
  message: string;
  refresh: boolean;
};

export function claimDecisionFailure(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimDecisionFailure {
  if (input.status === 409) {
    return { message: 'Klaim ini sudah diputuskan. Halaman diperbarui.', refresh: true };
  }
  if (input.status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    message: input.message || 'Gagal memproses klaim. Coba lagi.',
    refresh: false
  };
}

export function claimResolutionFailure(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimDecisionFailure {
  if (input.status === 409) {
    return { message: 'Status klaim sudah berubah. Halaman diperbarui.', refresh: true };
  }
  if (input.status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    message: input.message || 'Gagal menandai klaim selesai. Coba lagi.',
    refresh: false
  };
}

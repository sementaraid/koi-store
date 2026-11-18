
export const CLAIM_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const CLAIM_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export type ClaimWindowInfo = {
  open: boolean;
  label: string;
};

export function claimWindowInfo(endsAt: string | null, now: number): ClaimWindowInfo {
  if (!endsAt) return { open: false, label: '' };

  const remaining = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { open: false, label: 'Batas waktu klaim sudah lewat' };
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  return {
    open: true,
    label: `Sisa waktu klaim: ${hours ? `${hours} jam ${minutes} menit` : `${minutes} menit`}`
  };
}

export function remedyLabel(remedy: string): string {
  switch (remedy) {
    case 'refund':
      return 'Pengembalian dana';
    case 'replacement':
      return 'Ikan pengganti';
    default:
      return remedy;
  }
}

export function claimStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Menunggu tinjauan';
    case 'approved':
      return 'Disetujui';
    case 'disputed':
      return 'Disengketakan';
    case 'rejected':
      return 'Ditolak';
    case 'resolved':
      return 'Menunggu konfirmasi';
    case 'confirmed':
      return 'Selesai';
    default:
      return status;
  }
}

export type ClaimFailure = {
  message: string;
  refresh: boolean;
};

export function claimFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot atau klaim sudah berubah. Halaman diperbarui.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini bukan lot yang Anda menangkan.', refresh: true };
  }
  return { message: input.message || 'Gagal mengajukan klaim. Coba lagi.', refresh: false };
}

export function claimConfirmFailure(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimFailure {
  if (input.status === 409) {
    return { message: 'Klaim sudah dikonfirmasi. Halaman diperbarui.', refresh: true };
  }
  if (input.status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    message: input.message || 'Gagal mengonfirmasi klaim. Coba lagi.',
    refresh: false
  };
}

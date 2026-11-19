
export type FarmStatusTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention';

export type FarmStatusInfo = {
  label: string;
  tone: FarmStatusTone;
  title: string;
  body: string;
  reasonLabel?: string;
  approved: boolean;
};

export type FarmSellerStatus = {
  status: string;
  status_reason?: string | null;
  rejected_at?: Date | string | null;
};

export type FarmSoldLotsStatus = FarmSellerStatus & {
  approved_at?: Date | string | null;
};

export function soldLotsOpen(seller: FarmSoldLotsStatus): boolean {
  if (seller.status === 'open') return true;
  return seller.status === 'suspended' && Boolean(seller.approved_at);
}

export function farmStatusInfo(seller: FarmSellerStatus): FarmStatusInfo {
  switch (seller.status) {
    case 'open':
      return {
        label: 'Disetujui',
        tone: 'info',
        title: 'Kebun Anda sudah aktif',
        body: 'Pendaftaran disetujui. Anda bisa membuat lelang dan lot dari area petani.',
        approved: true
      };
    case 'pending_approval':
      return {
        label: 'Menunggu',
        tone: 'neutral',
        title: 'Menunggu persetujuan admin',
        body: 'Admin sedang memeriksa data kebun, KTP, dan rekening Anda. Anda bisa membuat lelang setelah disetujui.',
        approved: false
      };
    case 'suspended':
      return seller.rejected_at
        ? {
            label: 'Ditolak',
            tone: 'urgent',
            title: 'Pendaftaran kebun ditolak',
            body: 'Penolakan bersifat final. Pendaftaran tidak dapat diajukan ulang dengan akun ini.',
            reasonLabel: 'Alasan penolakan',
            approved: false
          }
        : {
            label: 'Ditangguhkan',
            tone: 'urgent',
            title: 'Kebun Anda ditangguhkan',
            body: 'Kebun Anda tidak dapat dipakai sampai admin mengaktifkannya kembali. Hubungi admin bila Anda tidak tahu sebabnya.',
            reasonLabel: 'Alasan',
            approved: false
          };
    case 'terminated':
      return {
        label: 'Ditutup',
        tone: 'muted',
        title: 'Kebun Anda sudah ditutup',
        body: 'Akun kebun ini tidak dapat dipakai lagi.',
        approved: false
      };
    default:
      return {
        label: 'Tidak dikenal',
        tone: 'neutral',
        title: 'Status kebun belum bisa dibaca',
        body: 'Muat ulang halaman. Bila status tetap tidak muncul, hubungi admin.',
        approved: false
      };
  }
}

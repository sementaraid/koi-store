/* How a seller's status reads to the farmer, in the house's Indonesian.

   Mercur's seller statuses (`SellerStatus`): `open`, `pending_approval`,
   `suspended`, `terminated`. Rejection (D-015) is a suspend with a reason, so
   `suspended` plus `rejected_at` is a rejected registration; a suspend without
   `rejected_at` is a takedown of an already-approved farm. */

export type FarmStatusTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention';

export type FarmStatusInfo = {
  label: string;
  tone: FarmStatusTone;
  title: string;
  body: string;
  /** Whether the reason on the seller should be shown as the rejection reason. */
  reasonLabel?: string;
  /** Whether the farmer can open the Farmer area home. */
  approved: boolean;
};

export type FarmSellerStatus = {
  status: string;
  status_reason?: string | null;
  rejected_at?: Date | string | null;
};

/** The status page's copy for one seller. */
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

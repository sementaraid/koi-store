import { ROUTES } from './routes';

export type NavItem = {
  href: string;
  label: string;
  hint: string;
  ready: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: 'Antrean',
    items: [
      {
        href: ROUTES.farms,
        label: 'Pendaftaran kebun',
        hint: 'Periksa KTP, foto kebun, dan rekening pemilik.',
        ready: true
      },
      {
        href: ROUTES.topups,
        label: 'Permintaan top-up',
        hint: 'Cocokkan bukti transfer dengan mutasi bank.',
        ready: true
      },
      {
        href: ROUTES.auctions,
        label: 'Persetujuan lelang',
        hint: 'Periksa kategori, foto, dan biaya tiap lelang.',
        ready: true
      },
      {
        href: ROUTES.liveAuctions,
        label: 'Pantau lelang',
        hint: 'Hapus bid yang salah dan hentikan lelang yang rusak.',
        ready: true
      },
      {
        href: ROUTES.claims,
        label: 'Klaim DOA',
        hint: 'Tinjau video unboxing dan putuskan sengketa.',
        ready: true
      },
      {
        href: ROUTES.reports,
        label: 'Arsip laporan',
        hint: 'Laporan lama pemenang yang tidak membayar, hanya untuk dibaca.',
        ready: true
      },
      {
        href: ROUTES.payments,
        label: 'Pembayaran pemenang',
        hint: 'Konfirmasi transfer pemenang ke rekening perusahaan.',
        ready: true
      },
      {
        href: ROUTES.farmPayouts,
        label: 'Pembayaran ke farm',
        hint: 'Catat transfer ke rekening farm setelah koi diterima.',
        ready: true
      }
    ]
  },
  {
    label: 'Saldo',
    items: [
      {
        href: ROUTES.adjustments,
        label: 'Koreksi saldo',
        hint: 'Perbaiki kesalahan dengan transaksi penyesuaian.',
        ready: true
      }
    ]
  },
  {
    label: 'Pengaturan',
    items: [
      {
        href: ROUTES.fees,
        label: 'Tabel biaya',
        hint: 'Biaya listing dan biaya ikut per lot, per kategori, plus jendela extend.',
        ready: true
      },
      {
        href: ROUTES.users,
        label: 'Pengguna',
        hint: 'Strike, banned, dan riwayat satu akun.',
        ready: true
      }
    ]
  }
];

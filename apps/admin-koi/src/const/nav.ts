import { ROUTES } from './routes';

/* The back office's sidebar, in build order.
 *
 * Every screen the MVP plan asks for is listed, with `ready` saying whether it
 * exists yet — the nav draws the whole map greyed rather than growing a link at
 * a time, so an operator can see what is coming and a developer can see what is
 * left. Flip `ready` in the same commit that adds the page. */
export type NavItem = {
  href: string;
  label: string;
  /** One line under the label: what an operator does on that screen. */
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
        ready: false
      },
      {
        href: ROUTES.topups,
        label: 'Permintaan top-up',
        hint: 'Cocokkan bukti transfer dengan mutasi bank.',
        ready: false
      },
      {
        href: ROUTES.auctions,
        label: 'Persetujuan lelang',
        hint: 'Periksa kategori, foto, dan biaya tiap lelang.',
        ready: false
      },
      {
        href: ROUTES.claims,
        label: 'Klaim DOA',
        hint: 'Tinjau video unboxing dan putuskan sengketa.',
        ready: false
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
        ready: false
      }
    ]
  },
  {
    label: 'Pengaturan',
    items: [
      {
        href: ROUTES.fees,
        label: 'Tabel biaya',
        hint: 'Biaya listing dan join per kategori, plus jendela extend.',
        ready: false
      },
      {
        href: ROUTES.users,
        label: 'Pengguna',
        hint: 'Strike, banned, dan riwayat satu akun.',
        ready: false
      }
    ]
  }
];

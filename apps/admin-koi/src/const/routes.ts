
export const ROUTES = {
  home: '/',
  login: '/masuk',
  signout: '/keluar',

  farms: '/kebun',
  topups: '/saldo/topup',
  adjustments: '/saldo/koreksi',
  fees: '/pengaturan/biaya',
  auctions: '/lelang',
  liveAuctions: '/lelang/langsung',
  users: '/pengguna',
  claims: '/klaim',
  reports: '/laporan'
} as const;

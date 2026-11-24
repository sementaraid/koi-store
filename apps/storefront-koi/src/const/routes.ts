
export const ROUTES = {
  home: "/",
  auctions: "/lelang",
  catalogs: "/katalog",
  categories: "/kategori",
  marketplace: "/toko",
  guide: "/panduan",
  partners: "/mitra",
  escrow: "/rekber",
  cart: "/keranjang",
  shipping: "/pengiriman",
  account: "/akun",
  orders: "/akun/pesanan",
  wonLots: "/akun/menang",
  myBids: "/akun/bid",
  addresses: "/akun/alamat",
  reviews: "/akun/ulasan",
  wallet: "/akun/saldo",
  topup: "/akun/topup",
  messages: "/akun/pesan",
  farm: "/akun/kebun",
  farmHome: "/akun/kebun/beranda",
  farmAuctionNew: "/akun/kebun/lelang/baru",
  farmSold: "/akun/kebun/terjual",
  settings: "/akun/pengaturan",
  login: "/masuk",
  signup: "/daftar",
  forgotPassword: "/lupa-sandi",
  newPassword: "/atur-sandi",
  signout: "/keluar",
  contact: "/kontak",
} as const

/** Sign-in with a return path, for links a guest must pass through auth. */
export const signInHref = (from: string) =>
  `${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(from)}`

/** Registration with a return path, for the guest join prompt. */
export const signUpHref = (from: string) =>
  `${ROUTES.signup}?redirect=${encodeURIComponent(from)}`

/** Top-up, with the shortfall prefilled (US-099 AC3, US-102 AC2). */
export const topupHref = (amount?: number) =>
  amount && amount > 0 ? `${ROUTES.topup}?amount=${amount}` : ROUTES.topup

export const auctionsTabHref = (tab: string) =>
  tab === "live" ? ROUTES.auctions : `${ROUTES.auctions}?status=${tab}`

export const lotHref = (id: string) => `${ROUTES.auctions}/${id}`

export const myBidsTabHref = (tab: string) =>
  tab === "aktif" ? ROUTES.myBids : `${ROUTES.myBids}?tab=${tab}`

export const partnerHref = (handle: string) => `${ROUTES.partners}/${handle}`

export const categoryHref = (handle: string) => `${ROUTES.categories}/${handle}`

export const orderHref = (id: string) => `${ROUTES.orders}/${id}`

export const koiHref = (handle: string) => `/produk/${handle}`

export const goodHref = (handle: string) => `/produk/${handle}`

export const pageHref = (base: string, page: number) => `${base}?page=${page}`

export const farmAuctionHref = (id: string) => `/akun/kebun/lelang/${id}`

export const farmHomeStatusHref = (status?: string) =>
  status ? `${ROUTES.farmHome}?status=${status}` : ROUTES.farmHome

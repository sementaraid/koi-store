
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

export const lotHref = (id: string) => `${ROUTES.auctions}/${id}`

export const partnerHref = (handle: string) => `${ROUTES.partners}/${handle}`

export const categoryHref = (handle: string) => `${ROUTES.categories}/${handle}`

export const orderHref = (id: string) => `${ROUTES.orders}/${id}`

export const koiHref = (handle: string) => `/produk/${handle}`

export const goodHref = (handle: string) => `/produk/${handle}`

export const pageHref = (base: string, page: number) => `${base}?page=${page}`

export const farmAuctionHref = (id: string) => `/akun/kebun/lelang/${id}`

export const farmHomeStatusHref = (status?: string) =>
  status ? `${ROUTES.farmHome}?status=${status}` : ROUTES.farmHome

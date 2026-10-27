/* The house's URL shape, in one place. Paths and path builders only — no React,
   no imports.

   Held once because a route name was written out at every link that pointed at
   it: `/lots/${id}` in five files, `/auctions` in four, `/catalogs` in three.
   When the router lands, or when `/koi/:id` becomes `/catalogs/:id`, this is the
   one file that changes instead of every call site that happened to spell it. */

/** Every static path the kit links to. */
export const ROUTES = {
  /** The front page. */
  home: "/",
  /** The floor: every lot the house is running. */
  auctions: "/lelang",
  /** The catalog: koi sold outright, at a price. */
  catalogs: "/katalog",
  /** The varieties the catalog is cut into — Medusa's product categories. */
  categories: "/kategori",
  /** The shop: everything that is not a koi. */
  marketplace: "/toko",
  /** The broadcast room. A lot rides as a query — see {@link roomHref}. */
  live: "/live",
  /** How bidding works. A standing page — see `const/info.ts`. */
  guide: "/panduan",
  /** The breeder directory. */
  partners: "/mitra",
  /** What the house holds the money under. A standing page. */
  escrow: "/rekber",
  /** What they are carrying and still owe. */
  cart: "/keranjang",
  /** Where it is going, and how — the step the freight is priced on. */
  shipping: "/pengiriman",
  /** Where the customer stands with the house. */
  account: "/akun",
  /** Everything they have bought, newest first. */
  orders: "/akun/pesanan",
  /** Where their koi get delivered. */
  addresses: "/akun/alamat",
  /** Name, contact, password. */
  settings: "/akun/pengaturan",
  /** Sign in. */
  login: "/masuk",
  /** Sign up. */
  signup: "/daftar",
  /** Ask the house for a reset link. */
  forgotPassword: "/lupa-sandi",
  /** Set a new password, with the token the link carries. */
  newPassword: "/atur-sandi",
  /** The way out. A POST route, not a page — see `(auth)/keluar/route.ts`. */
  signout: "/keluar",
  /** Reach the house. A standing page. */
  contact: "/kontak",
} as const

/** A lot's own dossier. */
export const lotHref = (id: string) => `${ROUTES.auctions}/${id}`

/** One breeder's own page. The id is the seller's handle, not its id — the
    page looks the seller up by handle so the URL stays readable. */
export const partnerHref = (handle: string) => `${ROUTES.partners}/${handle}`

/** One category's own catalog, cut to its handle and everything beneath it. */
export const categoryHref = (handle: string) => `${ROUTES.categories}/${handle}`

/** One checkout's own page — every seller's parcel from one payment. The id is
    the *order group's*, not a single order's: the customer paid once. */
export const orderHref = (id: string) => `${ROUTES.orders}/${id}`

/* A koi sold outright and a shelf good are both Medusa products here, so both
   resolve to the same product page; the two names are kept because the call
   sites read better for it, and because a split back out stays a one-file
   change. The `id` a page passes is the product handle. */

/** A koi in the catalog, sold outright. */
export const koiHref = (handle: string) => `/produk/${handle}`

/** A shelf good in the shop. */
export const goodHref = (handle: string) => `/produk/${handle}`

/** The room a lot is on the block in. A room takes many lots, so the lot rides
    as a query — the room's own `featured` is what honours it. */
export const roomHref = (id: string) => `${ROUTES.live}?lot=${id}`

/** A page of a feed, as the pager links it. */
export const pageHref = (base: string, page: number) => `${base}?page=${page}`

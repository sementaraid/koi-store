import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react"

import { ROUTES } from "@/const/routes"
import type { HeaderAccountLink, HeaderLink } from "@/types/header"

/** The nav a caller gets without saying otherwise. */
export const DEFAULT_LINKS: HeaderLink[] = [
  /* `Lelang Live` points at the room, not the auction list: it is the page that
     is showing what is on air right now, which is what the pulse promises. */
  { label: "Lelang Live", href: ROUTES.live, live: true },
  { label: "Katalog Koi", href: ROUTES.catalogs },
  { label: "Perlengkapan Kolam Koi", href: ROUTES.marketplace },
]

/**
 * The account menu, grouped by what the customer came to do — not by page:
 * - **Ikhtisar** — where they are with the house.
 * - **Transaksi** — what they have bought and what they are still carrying.
 * - **Akun** — where it is delivered, and how the account is kept.
 *
 * Only rows with a page behind them are listed. Bidding history, the watchlist
 * and the deposit balance were drawn here while the dashboard was a mockup;
 * nothing in Mercur backs them, so a row here would be a promise the site
 * cannot keep.
 *
 * Sign-out carries no `group`, so it falls to the trailing block: the last row
 * of the menu, under a rule of its own.
 */
export const DEFAULT_ACCOUNT_LINKS: HeaderAccountLink[] = [
  {
    label: "Beranda akun",
    href: ROUTES.account,
    icon: LayoutDashboard,
    group: "Ikhtisar",
  },

  { label: "Pesanan", href: ROUTES.orders, icon: Package, group: "Transaksi" },
  {
    label: "Keranjang",
    href: ROUTES.cart,
    icon: ShoppingBag,
    group: "Transaksi",
  },

  { label: "Alamat", href: ROUTES.addresses, icon: MapPin, group: "Akun" },
  {
    label: "Pengaturan",
    href: ROUTES.settings,
    icon: Settings,
    group: "Akun",
  },

  {
    label: "Keluar",
    href: ROUTES.signout,
    icon: LogOut,
    variant: "destructive",
  },
]

export const DEFAULT_SEARCH_PLACEHOLDER = "Cari varietas, sertifikat, breeder…"

/** The kit's logo. `public/logo-mark.png` is the 128px web copy of the source art. */
export const DEFAULT_BRAND_ICON = "/logo-mark.png"

/**
 * Member-tier ink — the gold of the design's own palette. A token rather than
 * an inline value (`--gold-ink`), because the same ink is now one of the kit's
 * text tones: see `src/components/css/ui.css`.
 */
export const GOLD_TEXT = "text-gold-ink"

import {
  CircleHelp,
  Gavel,
  Heart,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  User,
  Wallet,
} from "lucide-react"

import { ROUTES } from "@/components/constant/routes"
import type { HeaderAccountLink, HeaderLink } from "@/components/types/header"

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
 * - **Lelang Saya** — the bidding they carry.
 * - **Transaksi** — money and delivery.
 * - **Akun** — settings and the way out.
 *
 * Sign-out carries no `group`, so it falls to the trailing block: the last row
 * of the menu, under a rule of its own.
 */
export const DEFAULT_ACCOUNT_LINKS: HeaderAccountLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Ikhtisar",
  },
  { label: "Profil Saya", href: "/profil", icon: User, group: "Ikhtisar" },

  { label: "Bid Saya", href: "/bid", icon: Gavel, group: "Lelang Saya" },
  { label: "Watchlist", href: "/watchlist", icon: Star, group: "Lelang Saya" },
  { label: "Koi Favorit", href: "/favorit", icon: Heart, group: "Lelang Saya" },

  {
    label: "Keranjang",
    href: ROUTES.cart,
    icon: ShoppingBag,
    group: "Transaksi",
  },
  {
    label: "Tagihan",
    href: ROUTES.invoices,
    icon: Receipt,
    group: "Transaksi",
  },
  {
    label: "Saldo & Deposit",
    href: ROUTES.balance,
    icon: Wallet,
    group: "Transaksi",
  },

  { label: "Pengaturan", href: "/pengaturan", icon: Settings, group: "Akun" },
  { label: "Bantuan", href: "/bantuan", icon: CircleHelp, group: "Akun" },

  { label: "Keluar", href: "/keluar", icon: LogOut, variant: "destructive" },
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

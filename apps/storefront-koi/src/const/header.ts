import {
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Sprout,
} from "lucide-react"

import { ROUTES } from "@/const/routes"
import type { HeaderAccountLink, HeaderLink } from "@/types/header"

/* US-103 AC9: the desktop nav list, in board order. `Farm` points at the farm
   directory (`/mitra`); every label is the board's, not the old longer one. */
export const DEFAULT_LINKS: HeaderLink[] = [
  { label: "Lelang", href: ROUTES.auctions },
  { label: "Katalog", href: ROUTES.catalogs },
  { label: "Perlengkapan", href: ROUTES.marketplace },
  { label: "Farm", href: ROUTES.partners },
]

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
    label: "Ulasan",
    href: ROUTES.reviews,
    icon: MessageSquareText,
    group: "Akun",
  },
  { label: "Farm", href: ROUTES.farm, icon: Sprout, group: "Akun" },
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

export const DEFAULT_BRAND_ICON = undefined

export const GOLD_TEXT = "text-gold-ink"

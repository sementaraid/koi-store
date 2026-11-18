import {
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareText,
  MessagesSquare,
  Package,
  Settings,
  ShoppingBag,
  Sprout,
} from "lucide-react"

import { ROUTES } from "@/const/routes"
import type { HeaderAccountLink, HeaderLink } from "@/types/header"

export const DEFAULT_LINKS: HeaderLink[] = [
  { label: "Lelang Live", href: ROUTES.live, live: true },
  { label: "Katalog Koi", href: ROUTES.catalogs },
  { label: "Perlengkapan Kolam Koi", href: ROUTES.marketplace },
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

  {
    label: "Pesan",
    href: ROUTES.messages,
    icon: MessagesSquare,
    group: "Transaksi",
  },

  { label: "Alamat", href: ROUTES.addresses, icon: MapPin, group: "Akun" },
  {
    label: "Ulasan",
    href: ROUTES.reviews,
    icon: MessageSquareText,
    group: "Akun",
  },
  { label: "Kebun", href: ROUTES.farm, icon: Sprout, group: "Akun" },
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

export const DEFAULT_BRAND_ICON = undefined

export const GOLD_TEXT = "text-gold-ink"

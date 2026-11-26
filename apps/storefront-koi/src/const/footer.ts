import { Award, ShieldCheck } from "lucide-react"

import { ROUTES } from "@/const/routes"
import { SITE_NAME } from "@/const/site"
import type {
  FooterColumn,
  FooterLink,
  FooterTrust,
} from "@/types/footer"

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Layanan Lelang",
    links: [
      { label: "Jadwal Lelang Live", href: ROUTES.auctions },
      { label: "Katalog Nishikigoi Champion", href: ROUTES.catalogs },
      { label: "Varietas & Kategori", href: ROUTES.categories },
      { label: "Perlengkapan & Pakan", href: ROUTES.marketplace },
      { label: "Mitra Breeder Terverifikasi", href: ROUTES.partners },
    ],
  },
  {
    label: "Kepatuhan & Pengiriman",
    links: [
      { label: "Mekanisme Pembayaran", href: "/pembayaran" },
      { label: "Mekanisme Pembayaran & Pencairan", href: ROUTES.escrow },
      { label: "Standar Karantina BBKP RI", href: "/karantina" },
      { label: "Garansi Tiba Hidup (Klaim 4 Jam)", href: "/garansi" },
      { label: "Cek Sertifikat Breeder", href: "/sertifikat" },
    ],
  },
  {
    label: "Bantuan & Edukasi",
    links: [
      { label: "Pusat Bantuan & FAQ", href: "/bantuan" },
      { label: "Panduan bid pemula", href: "/panduan" },
      { label: "Hubungi Admin", href: "/kontak" },
      { label: "Kemitraan Farm", href: "/kemitraan" },
      { label: "Syarat & Ketentuan", href: "/syarat" },
    ],
  },
]

export const DEFAULT_FOOTER_LEGAL_LINKS: FooterLink[] = [
  { label: "Kebijakan Privasi", href: "/privasi" },
  { label: "Syarat & Ketentuan Bid", href: "/syarat" },
  { label: "Regulasi Lelang", href: "/regulasi" },
]

export const DEFAULT_FOOTER_TRUST: FooterTrust[] = [
  { label: "Pembayaran Terverifikasi", icon: ShieldCheck, tone: "info" },
  { label: "Verifikasi APKI Resmi", icon: Award, tone: "gold" },
]

export const DEFAULT_BRAND_NAME = SITE_NAME

export const DEFAULT_BRAND_SUBTITLE = "Portal Lelang Koi"

export const DEFAULT_FOOTER_TAGLINE =
  "Portal lelang resmi Nishikigoi terverifikasi nomor wahid di Indonesia. Terintegrasi karantina bersertifikat, pengiriman aman, dan jaminan hidup selamat (Live Arrival Guarantee)."

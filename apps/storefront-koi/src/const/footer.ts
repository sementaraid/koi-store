import { Award, ShieldCheck } from "lucide-react"

import { ROUTES } from "@/const/routes"
import type {
  FooterColumn,
  FooterLink,
  FooterTrust,
} from "@/types/footer"

/** Where the columns point without a caller saying otherwise. */
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
      { label: "Mekanisme Rekening Bersama", href: ROUTES.escrow },
      { label: "Standar Karantina BBKP RI", href: "/karantina" },
      { label: "Garansi Ikan Hidup D.O.A", href: "/garansi" },
      { label: "Cek Sertifikat Breeder", href: "/sertifikat" },
    ],
  },
  {
    label: "Bantuan & Edukasi",
    links: [
      { label: "Pusat Bantuan & FAQ", href: "/bantuan" },
      { label: "Panduan Bidding Pemula", href: "/panduan" },
      { label: "Hubungi Admin", href: "/kontak" },
      { label: "Kemitraan Farm & Breeder", href: "/kemitraan" },
      { label: "Syarat & Ketentuan", href: "/syarat" },
    ],
  },
]

/** The rights line's trailing row. */
export const DEFAULT_FOOTER_LEGAL_LINKS: FooterLink[] = [
  { label: "Kebijakan Privasi", href: "/privasi" },
  { label: "Syarat & Ketentuan Bidding", href: "/syarat" },
  { label: "Regulasi Lelang", href: "/regulasi" },
]

/**
 * The two claims under the tagline.
 *
 * @remarks
 * The shield is the verification the buyer is owed, the award the accreditation
 * the house earned — hence `info` for one and `gold` for the other.
 */
export const DEFAULT_FOOTER_TRUST: FooterTrust[] = [
  { label: "Pembayaran Terverifikasi", icon: ShieldCheck, tone: "info" },
  { label: "Verifikasi APKI Resmi", icon: Award, tone: "gold" },
]

export const DEFAULT_BRAND_NAME = "Mafia Koi Jogja"

export const DEFAULT_BRAND_SUBTITLE = "Portal Lelang Koi"

export const DEFAULT_FOOTER_TAGLINE =
  "Portal lelang resmi Nishikigoi terverifikasi nomor wahid di Indonesia. Terintegrasi karantina bersertifikat, pengiriman aman, dan jaminan hidup selamat (Live Arrival Guarantee)."

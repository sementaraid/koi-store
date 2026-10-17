import { Award, ShieldCheck } from "lucide-react"

import { ROUTES } from "@/components/constant/routes"
import type {
  FooterColumn,
  FooterLink,
  FooterTrust,
} from "@/components/types/footer"

/** Where the columns point without a caller saying otherwise. */
export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Layanan Lelang",
    links: [
      { label: "Jadwal Lelang Live", href: ROUTES.auctions },
      { label: "Lelang Kilat 24 Jam", href: `${ROUTES.auctions}/kilat` },
      { label: "Katalog Nishikigoi Champion", href: ROUTES.catalogs },
      { label: "Registrasi Penitip Lot Lelang", href: "/penitip" },
      { label: "Hasil Lelang Terdahulu", href: `${ROUTES.auctions}/hasil` },
    ],
  },
  {
    label: "Kepatuhan & Pengiriman",
    links: [
      { label: "Mekanisme Pembayaran", href: "/pembayaran" },
      { label: "Standar Karantina BBKP RI", href: "/karantina" },
      { label: "Garansi Ikan Hidup D.O.A", href: "/garansi" },
      { label: "Ekspedisi Kalog & Kargo Udara", href: "/pengiriman" },
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
  { label: "Status Layanan", href: "/status" },
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

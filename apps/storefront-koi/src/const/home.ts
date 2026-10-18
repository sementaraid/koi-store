import { Award, ShieldCheck, Truck } from "lucide-react"

import type { PartnerFarm } from "@/components/organisms/PartnerCard/PartnerCard"
import type { AuctionProduct } from "@/types/product"
import type { HomeClaim, HomeStat } from "@/types/home"

/* The page's demo floor. These exist so the page renders something real in
   Storybook and in the app before an API owns it; the app passes its own lots
   and they are never consulted.

   ponytail: deadlines are fixed at module load, so a session open past 42
   minutes sees the hero lot has ended — the countdown is real, the data is not.
   Delete these the day the API lands. */

const HOUR = 3_600_000
const image = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`

/** The hero lot: the one closing soonest. */
export const DEFAULT_FEATURED: AuctionProduct = {
  kind: "auction",
  id: "featured",
  title: "Kohaku 68 — Maruten, 4-step, Juara All Japan",
  image: image("koi-featured"),
  listing: {
    ref: "Lot 001",
    seller: "Sakai Fish Farm",
    sellerKind: "farm",
    category: "Kohaku",
    spec: "68 cm",
  },
  auction: {
    status: "live",
    currentBid: 48_500_000,
    bidCount: 34,
    endsAt: Date.now() + 42 * 60_000,
  },
  highlights: ["top-breeder", "top-bid"],
  stamps: ["certificate"],
  info: ["imported-japan", "female"],
}

/** The floor's remaining lots. */
export const DEFAULT_LOTS: AuctionProduct[] = [
  {
    kind: "auction",
    id: "2",
    title: "Sanke 58 — Sandan, Shiro Utsuri base",
    image: image("koi-sanke"),
    listing: {
      ref: "Lot 014",
      seller: "Momotaro Koi Farm",
      sellerKind: "farm",
      category: "Sanke",
      spec: "58 cm",
    },
    auction: {
      status: "live",
      currentBid: 21_000_000,
      bidCount: 12,
      endsAt: Date.now() + 3 * HOUR,
    },
    highlights: ["verified-breeder"],
    stamps: ["video-verified"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "3",
    title: "Showa 62 — Kindai, sumi pekat",
    image: image("koi-showa"),
    listing: {
      ref: "Lot 027",
      seller: "Dainichi Koi Farm",
      sellerKind: "farm",
      category: "Showa",
      spec: "62 cm",
    },
    auction: {
      status: "live",
      currentBid: 17_750_000,
      bidCount: 9,
      endsAt: Date.now() + 26 * HOUR,
    },
    highlights: ["popular"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "auction",
    id: "4",
    title: "Kohaku 45 — Tosai, pola inazuma",
    image: image("koi-tosai"),
    listing: {
      ref: "Lot 088",
      seller: "Koi Jogja Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "45 cm",
    },
    auction: {
      status: "upcoming",
      currentBid: 4_250_000,
      bidCount: 0,
      endsAt: Date.now() + 52 * HOUR,
    },
    highlights: ["no-bids"],
    stamps: ["certificate"],
    info: ["new-arrival"],
  },
  {
    kind: "auction",
    id: "5",
    title: "Shiro Utsuri 55 — Kindai, sumi tegas",
    image: image("koi-utsuri"),
    listing: {
      ref: "Lot 102",
      seller: "Sukabumi Koi Center",
      sellerKind: "farm",
      category: "Shiro Utsuri",
      spec: "55 cm",
    },
    auction: {
      status: "live",
      currentBid: 12_400_000,
      bidCount: 6,
      endsAt: Date.now() + 8 * HOUR,
    },
    highlights: ["verified-breeder"],
    stamps: ["certificate"],
    info: ["female"],
  },
]

/** The hero's proof row. */
export const DEFAULT_HOME_STATS: HomeStat[] = [
  { value: "12.400+", label: "Lot terjual" },
  { value: "180+", label: "Breeder terverifikasi" },
  { value: "100%", label: "Jaminan ikan hidup" },
]

/** The verified-breeder directory band. Figures as the house publishes them. */
export const DEFAULT_HOME_PARTNERS: PartnerFarm[] = [
  {
    id: "sentra-blitar-premier",
    name: "Sentra Blitar Premier",
    location: "Jawa Timur, Indonesia",
    rating: 4.98,
    facts: [
      { value: "142", label: "Kolam aktif" },
      { value: "100%", label: "Sertifikat APKI" },
      { value: "1.240+", label: "Ikan terlelang" },
    ],
    speciality: "Kohaku, Sanke, Showa",
    href: "/mitra/sentra-blitar-premier",
  },
  {
    id: "sukabumi-koi-center",
    name: "Sukabumi Koi Center",
    location: "Jawa Barat, Indonesia",
    rating: 4.94,
    facts: [
      { value: "88", label: "Kolam mud" },
      { value: "100%", label: "Gen asli Jepang" },
      { value: "850+", label: "Ikan terlelang" },
    ],
    speciality: "Shiro Utsuri, Asagi",
    href: "/mitra/sukabumi-koi-center",
  },
  {
    id: "jogja-nishikigoi-farm",
    name: "Jogja Nishikigoi Farm",
    location: "D.I. Yogyakarta, Indonesia",
    rating: 4.99,
    facts: [
      { value: "64", label: "Kolam karantina" },
      { value: "All Japan", label: "Official import" },
      { value: "980+", label: "Ikan terlelang" },
    ],
    speciality: "Dainichi & Sakai F0",
    href: "/mitra/jogja-nishikigoi-farm",
  },
  {
    id: "tulungagung-koi-park",
    name: "Tulungagung Koi Park",
    location: "Jawa Timur, Indonesia",
    rating: 4.96,
    facts: [
      { value: "95", label: "Kolam aktif" },
      { value: "100%", label: "Sertifikat APKI" },
      { value: "720+", label: "Ikan terlelang" },
    ],
    speciality: "Tancho, Asagi",
    href: "/mitra/tulungagung-koi-park",
  },
  {
    id: "niigata-oyako-farm",
    name: "Niigata Oyako Farm",
    location: "Niigata, Jepang",
    rating: 5.0,
    facts: [
      { value: "36", label: "Kolam indukan" },
      { value: "F0", label: "Silsilah asli" },
      { value: "410+", label: "Ikan terlelang" },
    ],
    speciality: "Kohaku, Taisho Sanshoku",
    href: "/mitra/niigata-oyako-farm",
  },
  {
    id: "bogor-koi-sanctuary",
    name: "Bogor Koi Sanctuary",
    location: "Jawa Barat, Indonesia",
    rating: 4.91,
    facts: [
      { value: "52", label: "Kolam karantina" },
      { value: "100%", label: "Gen asli Jepang" },
      { value: "640+", label: "Ikan terlelang" },
    ],
    speciality: "Showa, Utsuri",
    href: "/mitra/bogor-koi-sanctuary",
  },
]

/** The "why us" panels: quarantine, breeder verification, delivery. */
export const DEFAULT_HOME_CLAIMS: HomeClaim[] = [
  {
    icon: ShieldCheck,
    title: "Karantina bersertifikat",
    body: "Setiap lot melewati karantina BBKP RI sebelum dikirim, dengan dokumen yang bisa Anda periksa.",
  },
  {
    icon: Award,
    title: "Breeder terverifikasi",
    body: "Hanya farm mitra bersertifikat resmi yang boleh menitipkan lot di lelang kami.",
  },
  {
    icon: Truck,
    title: "Pengiriman aman",
    body: "Ekspedisi kalog dan kargo udara, dengan jaminan hidup selamat (Live Arrival Guarantee).",
  },
]

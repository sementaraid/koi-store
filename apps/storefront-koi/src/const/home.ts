import { Award, ShieldCheck, Truck } from "lucide-react"

import type { PartnerFarm } from "@/components/organisms/PartnerCard/PartnerCard"
import type { HomeClaim, HomeStat } from "@/types/home"

export const DEFAULT_HOME_STATS: HomeStat[] = [
  { value: "12.400+", label: "Lot terjual" },
  { value: "180+", label: "Breeder terverifikasi" },
  { value: "100%", label: "Jaminan ikan hidup" },
]

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

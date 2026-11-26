import { Award, ShieldCheck, Truck } from "lucide-react"

import type { HomeClaim } from "@/types/home"

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

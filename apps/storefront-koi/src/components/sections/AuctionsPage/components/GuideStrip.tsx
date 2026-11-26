import { Info } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"

// Current rules only, and no number that differs per auction (US-097 AC7).
// US-111 AC6 (D-070): the join fee is paid per lot. The winner pays the
// company account, an admin verifies (D-068).
export function GuideStrip() {
  return (
    <aside
      data-slot="guide-strip"
      className="flex items-start gap-3 rounded-control border border-accent-foreground/25 bg-accent p-4 text-sm"
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-ink" />
      <p className="text-muted-foreground">
        <strong className="font-semibold text-foreground">Cara lelang di sini.</strong> Isi saldo,
        ikut lot (biaya ikut dibayar per lot dari saldo; tidak dikembalikan kecuali lelang
        dibatalkan), lalu bid. Bid di menit terakhir memperpanjang akhir lot itu. Jika menang,
        transfer harga menang ke rekening Koi Auction House dalam 1×24 jam; admin memverifikasi
        pembayaran sebelum koi dikirim.{" "}
        <Link
          href={ROUTES.guide}
          className="font-semibold text-foreground underline underline-offset-2"
        >
          Panduan bid
        </Link>
      </p>
    </aside>
  )
}

import { Info } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"

// Current rules only, and no number that differs per auction (US-097 AC7).
export function GuideStrip() {
  return (
    <aside className="flex items-start gap-3 rounded-control border border-divider bg-surface p-4 text-sm">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="text-muted-foreground">
        <strong className="font-semibold text-foreground">Cara lelang di sini.</strong> Isi saldo,
        ikut lelang (satu biaya ikut per lelang, dibayar dari saldo), lalu bid. Bid di menit
        terakhir memperpanjang akhir lot itu.{" "}
        <Link href={ROUTES.guide} className="font-semibold text-foreground underline underline-offset-2">
          Panduan bid
        </Link>
      </p>
    </aside>
  )
}

import { BadgeCheck } from "lucide-react"

import { Button } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { partnerHref } from "@/const/routes"
import type { AuctionProduct } from "@/types/product"

// The "Tentang farm" tab. The store lot contract returns the seller's name,
// handle and kind only, so nothing else is shown or invented.
export function FarmAbout({ lot }: { lot: AuctionProduct }) {
  const { listing } = lot

  if (!listing?.seller) {
    return (
      <p className="text-sm text-muted-foreground">
        Informasi farm belum tersedia untuk lot ini.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">{listing.seller}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BadgeCheck aria-hidden className="size-4 shrink-0 text-success" />
          {listing.sellerKind === "farm"
            ? "Breeder terdaftar"
            : "Penjual terdaftar"}
        </p>
      </div>

      {listing.sellerHandle ? (
        <Button
          variant="outline"
          render={<Link href={partnerHref(listing.sellerHandle)} />}
          className="w-fit"
        >
          Lihat halaman farm
        </Button>
      ) : null}
    </div>
  )
}

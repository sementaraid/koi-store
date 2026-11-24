import { CalendarClock } from "lucide-react"

import { Badge } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { formatEndTime } from "@/lib/helpers/lot-card"
import type { UpcomingAuction } from "@/lib/helpers/auction-list"

// One card per scheduled auction: farm, lot count and start (US-097 AC6). The
// dashed border marks it as not open yet. No reminder button (mvp-Q59), no price.
export function UpcomingAuctionCard({ auction, href }: { auction: UpcomingAuction; href: string }) {
  const { farm, lotCount, startAt, image } = auction

  return (
    <article
      data-slot="upcoming-auction-card"
      className="relative flex w-full flex-col overflow-hidden rounded-control border border-dashed border-divider bg-background"
    >
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={farm ? `Lot dari ${farm}` : "Foto lot"}
            loading="lazy"
            className="aspect-4/3 w-full object-cover"
          />
        ) : (
          <div aria-hidden className="aspect-4/3 w-full bg-muted" />
        )}
        <Badge variant="neutral" icon={<CalendarClock />} className="absolute top-3 left-3">
          Akan datang
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold">
            <Link
              href={href}
              className="rounded-control after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
            >
              {farm ?? "Lelang"}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground tabular-nums">{lotCount} lot</p>
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-divider pt-3 text-sm tabular-nums">
          <span className="text-muted-foreground">Mulai</span>
          <span className="font-semibold">{formatEndTime(startAt)}</span>
        </div>
      </div>
    </article>
  )
}

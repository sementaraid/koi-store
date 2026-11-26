import { Link } from "@/components/atoms/Link/Link"
import type { UpcomingAuction } from "@/lib/helpers/auction-list"
import { formatEndTime } from "@/lib/helpers/lot-card"
import { wibParts } from "@/lib/helpers/wib"

// One scheduled session, as on board 08: a date tile, `Sesi {farm}` and
// `{n} lot · {start, WIB}` (US-097 AC17). The dashed border still marks it as
// not open yet (AC6). No reminder button (D-066), no photo, no price. The
// session's varieties join the meta line when its lots carry them (US-105 AC5).
export function UpcomingAuctionCard({ auction, href }: { auction: UpcomingAuction; href: string }) {
  const { farm, lotCount, startAt, varieties } = auction
  const start = wibParts(new Date(startAt).getTime())
  // Two digits on the tile ("02"), while the sentence keeps "2 Des" (board 08).
  const day = String(start.day).padStart(2, "0")

  return (
    <article
      data-slot="upcoming-auction-card"
      className="relative flex w-full items-center gap-4 rounded-card border border-dashed border-card-edge bg-background p-4 shadow-card"
    >
      {/* The tile repeats the date that the meta line already spells out, so it
          is decoration for screen readers. */}
      <div
        aria-hidden
        className="flex size-14 shrink-0 flex-col items-center justify-center rounded-control border border-accent-foreground/25 bg-accent text-accent-foreground"
      >
        <span className="text-xs font-bold uppercase">{start.monthShort}</span>
        <span className="text-lg leading-tight font-bold tabular-nums">{day}</span>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold">
          <Link
            href={href}
            className="rounded-control after:absolute after:inset-0 after:rounded-card focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
          >
            Sesi {farm ?? "lelang"}
          </Link>
        </h3>
        <p className="truncate text-sm text-muted-foreground tabular-nums">
          {lotCount} lot · {formatEndTime(startAt)}
          {varieties.length > 0 ? ` · ${varieties.join(", ")}` : ""}
        </p>
      </div>
    </article>
  )
}

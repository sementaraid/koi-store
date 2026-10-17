import type { ReactNode } from "react"
import { cn } from "cn"

import { CONTAINER } from "@/components/constant/layout"

/** Props for {@link LotLayout}: the two columns. */
export type LotLayoutProps = {
  /** The left column, seven twelfths: what the lot looks like and what it is. */
  media: ReactNode
  /** The right column, five twelfths: what it stands at and what backs it. */
  aside: ReactNode
  className?: string
}

/**
 * The dossier's frame: one gutter, and the lot laid out in two columns.
 *
 * @remarks
 * A lot's page and the room it is bid in show the same lot and used to draw the
 * same grid — seven twelfths of media and facts, five of money and proof,
 * divided at `lg` and stacked below it. Held once, because the two surfaces are
 * meant to read as one dossier seen twice, and two copies of a breakpoint is how
 * one of them ends up a column narrower than the other.
 *
 * The gap is deliberate and different per column: `gap-10` between the media and
 * the facts it backs, `gap-5` between the board and the trail under it, which is
 * a tighter cluster because a bidder reads those two together.
 *
 * The trail is not a prop: `PageShell` draws it above this frame, in the same
 * gutter, so a lot and a feed put their breadcrumb in the same place.
 */
export function LotLayout({ media, aside, className }: LotLayoutProps) {
  return (
    <div className={cn(CONTAINER, "pt-5 pb-8", className)}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-7">{media}</div>
        <aside className="flex flex-col gap-5 lg:col-span-5">{aside}</aside>
      </div>
    </div>
  )
}

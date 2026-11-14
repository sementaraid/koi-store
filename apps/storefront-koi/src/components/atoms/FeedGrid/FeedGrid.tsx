import type { ReactNode } from "react"
import { cn } from "cn"

/** Props for {@link FeedGrid}. */
export type FeedGridProps = {
  /** Already-drawn cards, in display order. */
  children: ReactNode
  /** Cards per row on a wide page. A feed with a filter sidebar beside it has
      less width to spend, so it asks for three. @defaultValue `4` */
  cols?: 3 | 4
  className?: string
}

/** The wide-page track count, as a literal class each — Tailwind scans source
    text, so `lg:grid-cols-${cols}` would compile to nothing. */
const COLS = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const

/**
 * Four-across on a wide page, two on a tablet, one on a phone — the grid every
 * product feed draws. Three-across where the feed shares its row with a
 * sidebar.
 *
 * @remarks
 * The tile's own `gap-5` and breakpoints, in one string, because the floor, the
 * catalog, the shop and the homepage had four copies of them and a tile that
 * steps a breakpoint earlier than its neighbours reads as a different card.
 *
 * @example
 * <FeedGrid>
 *   {items.map((item) => <ProductCard key={item.id} product={item} />)}
 * </FeedGrid>
 */
export function FeedGrid({ children, cols = 4, className }: FeedGridProps) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", COLS[cols], className)}>
      {children}
    </div>
  )
}

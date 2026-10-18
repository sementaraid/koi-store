import type { ReactNode } from "react"
import { cn } from "cn"

/** Props for {@link FeedGrid}. */
export type FeedGridProps = {
  /** Already-drawn cards, in display order. */
  children: ReactNode
  className?: string
}

/**
 * Four-across on a wide page, two on a tablet, one on a phone — the grid every
 * product feed draws.
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
export function FeedGrid({ children, className }: FeedGridProps) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  )
}

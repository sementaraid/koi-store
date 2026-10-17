import { SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/koi/button"
import { RenderIf } from "@/components/module/render-if"

/** Props for {@link FeedSummary}. */
export type FeedSummaryProps = {
  /** Items matching the filter, before paging. */
  total: number
  /** What those items are, in this feed's own words: `"lot live"`, `"koi"`,
      `"produk tersedia"`. Keyed off the current status. */
  statusLabel: string
  /** The category the feed is narrowed to, or `""` for all of them. */
  category: string
  /** The page being drawn, 1-based, already clamped. */
  page: number
  /** Pages available. At least 1; the `halaman n/m` tail is drawn only past it. */
  pageCount: number
  /** Resets the filter. Omitted — nothing is narrowed — no reset is drawn. */
  onReset?: () => void
  className?: string
}

/**
 * The line over a feed's grid: what the current narrowing produced, and the way
 * back out of it.
 *
 * @remarks
 * `aria-live="polite"` because a filter change is the one event on these pages
 * that must be announced — nothing else moves focus, so nothing else tells a
 * screen reader the grid changed.
 *
 * One component for the floor, the catalog and the shop, which drew this
 * identically three times: the same count, the same three-part tail — status,
 * category, page — and the same ghost reset. The `onReset` is the caller's to
 * withhold: only a narrowed feed offers a way back.
 *
 * @example
 * <FeedSummary
 *   total={total}
 *   statusLabel={STATUS_LABEL[filter.status]}
 *   category={filter.category}
 *   page={current}
 *   pageCount={pageCount}
 *   onReset={narrowing ? () => onFilterChange?.(DEFAULT_AUCTION_FILTER) : undefined}
 * />
 */
export function FeedSummary({
  total,
  statusLabel,
  category,
  page,
  pageCount,
  onReset,
  className,
}: FeedSummaryProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {total}
        </span>{" "}
        {statusLabel}
        <RenderIf when={category}>{(c) => <> · {c}</>}</RenderIf>
        {pageCount > 1 ? (
          <>
            {" "}
            · halaman{" "}
            <span className="tabular-nums">
              {page}/{pageCount}
            </span>
          </>
        ) : null}
      </p>

      <RenderIf when={onReset}>
        {(reset) => (
          <Button size="sm" variant="ghost" onClick={reset}>
            <SlidersHorizontal aria-hidden />
            Reset filter
          </Button>
        )}
      </RenderIf>
    </div>
  )
}

import { SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
export type FeedSummaryProps = {
  total: number
  statusLabel: string
  category: string
  page: number
  pageCount: number
  onReset?: () => void
  className?: string
}

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
        <RenderIf when={pageCount > 1}>
          {() => (
            <>
              {" "}
              · halaman{" "}
              <span className="tabular-nums">
                {page}/{pageCount}
              </span>
            </>
          )}
        </RenderIf>
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

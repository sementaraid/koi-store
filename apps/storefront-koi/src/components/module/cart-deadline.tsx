import { AlarmClock } from "lucide-react"

import { RenderIf } from "@/components/module/render-if"
import type { CountdownTarget } from "@/hooks/use-countdown"
import { formatClock } from "@/helper/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

/** Props for {@link CartDeadline}. */
export type CartDeadlineProps = {
  /** Lots in the cart whose money is not yet settled. Nothing is drawn at zero
      — a cart with no win has no deadline to race. */
  lots: number
  /** Which lot the window belongs to, for the sentence. Omitted, it says "lot"
      rather than naming one. */
  ref?: string
  /** When it runs out. Omitted, the sentence stands without a clock. */
  dueAt?: CountdownTarget
  className?: string
}

/**
 * The cart's alarm: a lot was won, the money is not in, and there is a clock on
 * it.
 *
 * @remarks
 * Drawn as a band over the list rather than a field on the won line, because the
 * consequence is not about that line — the house releases the lot *and* penalises
 * the account, which is a fact about the visitor, not about the fish. A row-level
 * clock would say the first half and leave the second out.
 *
 * The clock is a bare `HH:MM:SS` in mono, not {@link formatRemaining}'s
 * sentence: it is counting seconds, and a figure that changes every second must
 * not reflow the sentence beside it.
 */
export function CartDeadline({
  lots,
  ref,
  dueAt,
  className,
}: CartDeadlineProps) {
  const remaining = useCountdown(dueAt)

  return (
    <div
      data-slot="cart-deadline"
      /* `role="status"` rather than `alert`: it is a standing condition, not an
         event that just happened, and a screen reader should meet it once on
         arrival rather than be interrupted by it. */
      role="status"
      className={`flex flex-wrap items-center gap-3.5 rounded-xl bg-destructive/8 px-4 py-3.5 ${className ?? ""}`}
    >
      <AlarmClock
        aria-hidden
        className="size-5 shrink-0 text-destructive-ink"
      />

      <p className="min-w-[220px] flex-1 text-sm leading-relaxed text-pretty">
        <strong className="font-bold text-destructive-ink">
          {lots} lot menang menunggu pembayaran.
        </strong>{" "}
        <span className="text-muted-foreground">
          Lewat batas waktu, lot dilepas ke penjual &amp; akun kena penalti.
        </span>
        <RenderIf when={ref}>{(value) => <> Lot {value}.</>}</RenderIf>
      </p>

      {/* A ternary, not `RenderIf`: `0` is a real reading here — the window has
          run out — and `RenderIf`'s gate is truthiness. */}
      {remaining !== null ? (
        <span className="font-mono text-lg font-medium text-destructive-ink tabular-nums">
          {formatClock(remaining)}
        </span>
      ) : null}
    </div>
  )
}

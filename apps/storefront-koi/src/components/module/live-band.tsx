import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { LIVE_TINT } from "@/components/constant/live"
import { PulseIcon } from "@/components/module/pulse-icon"

/** Props for {@link LiveBand}. */
export type LiveBandProps = ComponentProps<"div"> & {
  /** What is on air, e.g. `"Sesi Spesial Dainichi"`, or what the lot's state is
      on a page's own board, e.g. `"Sedang dilelang di ruang siaran"`. */
  title: string
  /** The clock, already formatted. Omitted, the band carries the sentence alone
      — a page's board has no broadcast to band it against. */
  clock?: ReactNode
  /** Whether the clock is inside its closing window, which turns it destructive. */
  closing?: boolean
}

/**
 * The live header band over a board or a lot's own card: the pulse, what the
 * state is, and — on air — how long is left.
 *
 * @remarks
 * The tint is the badge's own `live` tone (`constant/live.ts` holds the one
 * string), because the pill on a tile and the band on the board behind it are
 * the same claim about the same lot and must not be two shades of red.
 *
 * A clock left out is not the same as a clock at zero, which is why `clock` is
 * a node and not a number: `formatRemaining(0)` is a real reading, and the
 * caller decides whether the state has one.
 */
export function LiveBand({
  title,
  clock,
  closing,
  className,
  ...props
}: LiveBandProps) {
  return (
    <div
      data-slot="live-band"
      className={cn(
        LIVE_TINT,
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-xs font-bold",
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        <PulseIcon />
        <span className="truncate">{title}</span>
      </span>

      {clock === undefined ? null : (
        <span
          className={cn(
            "font-mono tabular-nums",
            closing && "text-destructive"
          )}
        >
          {clock}
        </span>
      )}
    </div>
  )
}

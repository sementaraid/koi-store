import type { ComponentProps } from "react"
import { cn } from "cn"
import { Activity, ShieldCheck } from "lucide-react"

import { CONTAINER } from "@/components/constant/layout"
import { PulseIcon } from "@/components/module/pulse-icon"

/** One figure the house publishes beside the broadcast: a value and what it counts. */
export type BroadcastStat = {
  /** The figure, already formatted for display, e.g. `"Rp 1,42 M"`. */
  value: string
  /** What it counts, e.g. `"Escrow terkunci"`. */
  label: string
}

/** Props for {@link BroadcastBar}. */
export type BroadcastBarProps = ComponentProps<"div"> & {
  /** What is on air, as one line. Omitted, the bar carries the counts alone. */
  message?: string
  /** How many lots are open right now. Omitted, the count is left out. */
  liveCount?: number
  /** The proof figures, in reading order. `[]` drops them. */
  stats?: BroadcastStat[]
}

/**
 * The band under the header of a live floor: what is on air, and the house's
 * figures — the ticker a broadcast room needs and a catalogue page does not.
 *
 * Presentation only. The latency and escrow figures are the house's claims, not
 * measurements this component takes: it renders what it is handed.
 *
 * @remarks
 * The two icons are fixed to their stat by position rather than by a prop on
 * {@link BroadcastStat}, because there are exactly two figures looking for two
 * marks — a third would read better with its label alone than with a borrowed
 * glyph. A stat past the second is drawn without one.
 *
 * @example
 * <BroadcastBar
 *   message="Sesi Spesial Dainichi sedang berlangsung"
 *   liveCount={38}
 *   stats={[
 *     { label: "Escrow terkunci", value: "Rp 1,42 M" },
 *     { label: "Latency", value: "18ms" },
 *   ]}
 * />
 */
export function BroadcastBar({
  message,
  liveCount,
  stats = [],
  className,
  ...props
}: BroadcastBarProps) {
  const marks = [ShieldCheck, Activity]

  return (
    <div
      data-slot="broadcast-bar"
      className={cn(
        "w-full border-b border-border bg-card shadow-[0_2px_12px_oklch(0.2_0.03_265/4%)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          CONTAINER,
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <PulseIcon />
          <span className="shrink-0 text-2xs font-bold tracking-wider text-live-ink uppercase">
            Live Broadcast
          </span>
          <span aria-hidden className="h-3 w-px shrink-0 bg-border" />
          <p className="min-w-0 truncate text-xs text-foreground">
            {message}
            {liveCount === undefined ? null : (
              <span className="font-bold text-live-ink">
                {" • "}
                {liveCount} lot aktif
              </span>
            )}
          </p>
        </div>

        {stats.length ? (
          <dl className="flex shrink-0 items-center gap-x-5 gap-y-1">
            {stats.map(({ label, value }, i) => {
              const Icon = marks[i]
              return (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  {Icon ? (
                    <Icon aria-hidden className="size-4 shrink-0 text-info" />
                  ) : null}
                  <dt className="text-muted-foreground">{label}:</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              )
            })}
          </dl>
        ) : null}
      </div>
    </div>
  )
}

import type { ComponentProps } from "react"
import { cn } from "cn"
import { Activity, ShieldCheck } from "lucide-react"

import { CONTAINER } from "@/const/layout"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { RenderIf } from "@koi/ui"

export type BroadcastStat = {
  value: string
  label: string
}

export type BroadcastBarProps = ComponentProps<"div"> & {
  message?: string
  liveCount?: number
  stats?: BroadcastStat[]
}

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
            <RenderIf when={liveCount !== undefined}>
              {() => (
                <span className="font-bold text-live-ink">
                  {" • "}
                  {liveCount} lot aktif
                </span>
              )}
            </RenderIf>
          </p>
        </div>

        <RenderIf when={stats.length}>
          {() => (
            <dl className="flex shrink-0 items-center gap-x-5 gap-y-1">
              {stats.map(({ label, value }, i) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <RenderIf when={marks[i]}>
                    {(Icon) => (
                      <Icon aria-hidden className="size-4 shrink-0 text-info" />
                    )}
                  </RenderIf>
                  <dt className="text-muted-foreground">{label}:</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </RenderIf>
      </div>
    </div>
  )
}

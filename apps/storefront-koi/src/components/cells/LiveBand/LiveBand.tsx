import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { LIVE_TINT } from "@/const/live"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { RenderIf } from "@koi/ui"

export type LiveBandProps = ComponentProps<"div"> & {
  title: string
  clock?: ReactNode
  closing?: boolean
}

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

      <RenderIf when={clock !== undefined}>
        {() => (
          <span
            className={cn(
              "font-mono tabular-nums",
              closing && "text-destructive"
            )}
          >
            {clock}
          </span>
        )}
      </RenderIf>
    </div>
  )
}

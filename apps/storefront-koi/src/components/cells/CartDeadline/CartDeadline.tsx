import { AlarmClock } from "lucide-react"

import { RenderIf } from "@koi/ui"
import type { CountdownTarget } from "@/hooks/use-countdown"
import { formatClock } from "@/lib/helpers/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

export type CartDeadlineProps = {
  lots: number
  ref?: string
  dueAt?: CountdownTarget
  className?: string
}

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

      <RenderIf when={remaining !== null}>
        {() => (
          <span className="font-mono text-lg font-medium text-destructive-ink tabular-nums">
            {formatClock(remaining!)}
          </span>
        )}
      </RenderIf>
    </div>
  )
}

import { CircleCheck } from "lucide-react"

import { Badge, Button } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { formatPrice } from "@/lib/helpers/format-price"
import { formatBarCountdown } from "@/lib/helpers/lot-card"
import type { LotBarAction } from "@/lib/helpers/lot-action"

export type LotPriceBarProps = {
  label: string
  amount: number
  currency?: string
  remaining: number | null
  action?: LotBarAction
  /* The guest action is a link; the join and bid actions are buttons that open
     the page's one dialog or sheet. */
  signInHref?: string
  onAction?: () => void
}

// US-098 AC3 / US-099 AC11: the phone's sticky summary and the state's one
// primary action. It sits above the US-103 bottom nav, so the page reserves
// this bar's height plus the nav's below its content.
export function LotPriceBar({
  label,
  amount,
  currency,
  remaining,
  action,
  signInHref,
  onAction,
}: LotPriceBarProps) {
  const showsAction = action !== undefined && action.kind !== "none"

  return (
    <div
      data-slot="lot-price-bar"
      className="fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-40 border-t border-divider bg-card lg:hidden"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pt-3 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-base leading-6 font-bold whitespace-nowrap tabular-nums">
              {formatPrice(amount, currency)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Sisa waktu</p>
            <p className="text-base leading-6 font-bold whitespace-nowrap tabular-nums">
              {remaining === null ? "…" : formatBarCountdown(remaining)}
            </p>
          </div>
        </div>

        {showsAction ? (
          <div className="mt-2 border-t border-divider pt-2">
            {action.kind === "sign-in" ? (
              <Button
                size="lg"
                render={<Link href={signInHref ?? ROUTES.login} />}
                nativeButton={false}
                className="w-full"
              >
                {action.label}
              </Button>
            ) : action.kind === "highest" ? (
              <div role="status" className="flex min-h-12 items-center justify-center">
                <Badge variant="success" icon={<CircleCheck aria-hidden />}>
                  {action.label}
                </Badge>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={action.disabled}
                onClick={onAction}
              >
                {action.label}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

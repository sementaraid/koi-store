'use client'

import { CircleCheck, Pencil } from "lucide-react"
import { useEffect, useRef } from "react"

import { Badge, Button } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { formatPrice } from "@/lib/helpers/format-price"
import { formatBarCountdown } from "@/lib/helpers/lot-card"
import type { LotBarAction } from "@/lib/helpers/lot-action"
import { formatBidAmount } from "@/lib/helpers/place-bid"
import { formatApproxRemaining } from "@/lib/helpers/poll"

export type LotPriceBarProps = {
  label: string
  amount: number
  currency?: string
  remaining: number | null
  // US-100 AC3: no fresh poll. The countdown is approximate and a bid waits.
  stale?: boolean
  action?: LotBarAction
  /* The guest action is a link; the join action is a button that opens the
     page's join dialog. */
  signInHref?: string
  /* US-099 AC14: the guest footer carries AC1's copy and both guest paths, so
     the inline prompt is not repeated on the phone. */
  signUpHref?: string
  guestCopy?: string
  onAction?: () => void
  /* US-099 AC13: a joined phone viewer picks one of the quick amounts here, and
     the button opens the confirmation sheet directly (the intermediate "Pasang
     bid" sheet is gone). The pencil asks for the typed input instead. */
  bidOptions?: number[]
  bidAmount?: number
  balance?: number | null
  onSelectAmount?: (amount: number) => void
  onEditAmount?: () => void
  onBid?: (amount: number) => void
}

// US-098 AC3 / US-099 AC11 / AC13 / AC14: the phone's sticky summary and the
// state's one primary action. On the lot page it replaces the US-103 tab bar
// (AC14), so it sits at the very bottom. It also publishes its measured height
// as `--lot-bar-h`, which the shell reserves below the page content: the states
// differ in height, and an exact value keeps the footer's last links clear.
export function LotPriceBar({
  label,
  amount,
  currency,
  remaining,
  stale = false,
  action,
  signInHref,
  signUpHref,
  guestCopy,
  onAction,
  bidOptions,
  bidAmount,
  balance,
  onSelectAmount,
  onEditAmount,
  onBid,
}: LotPriceBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    const shell = bar?.closest<HTMLElement>('[data-slot="shell"]')
    if (!bar || !shell) return

    const publish = () =>
      shell.style.setProperty('--lot-bar-h', `${bar.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(bar)

    return () => {
      observer.disconnect()
      shell.style.removeProperty('--lot-bar-h')
    }
  }, [])

  const showsAction = action !== undefined && action.kind !== "none"
  const showsBidChoices =
    action?.kind === "bid" &&
    bidOptions !== undefined &&
    bidOptions.length > 0 &&
    bidAmount !== undefined
  // AC3: a bid is the one action held back while the price may be stale.
  const bidWaiting = stale && action?.kind === "bid"

  return (
    <div
      ref={barRef}
      data-slot="lot-price-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
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
              {remaining === null
                ? "…"
                : stale
                  ? formatApproxRemaining(remaining)
                  : formatBarCountdown(remaining)}
            </p>
          </div>
        </div>

        {showsAction ? (
          <div className="mt-2 border-t border-divider pt-2">
            {action.kind === "sign-in" ? (
              <div className="flex flex-col gap-2">
                {guestCopy ? (
                  <p className="text-xs leading-[18px] text-muted-foreground">
                    {guestCopy}
                  </p>
                ) : null}
                <Button
                  size="lg"
                  render={<Link href={signInHref ?? ROUTES.login} />}
                  nativeButton={false}
                  className="w-full"
                >
                  {action.label}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href={signUpHref ?? ROUTES.signup} />}
                  nativeButton={false}
                  className="w-full"
                >
                  Daftar gratis
                </Button>
              </div>
            ) : action.kind === "highest" ? (
              <div
                role="status"
                className="flex min-h-12 flex-col items-center justify-center gap-1"
              >
                <Badge variant="success" icon={<CircleCheck aria-hidden />}>
                  {action.label}
                </Badge>
                {balance !== null && balance !== undefined ? (
                  <p className="text-xs text-muted-foreground">
                    Saldo tersedia{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatPrice(balance, currency)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : showsBidChoices ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                  <span>Pilih nominal bid</span>
                  {balance !== null && balance !== undefined ? (
                    <span>
                      Saldo tersedia{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatPrice(balance, currency)}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div
                  role="group"
                  aria-label="Pilih nominal bid"
                  className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-2"
                >
                  {bidOptions.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={option === bidAmount ? "solid" : "outline"}
                      className="h-11 min-w-0 px-1 text-xs tabular-nums"
                      aria-pressed={option === bidAmount}
                      aria-label={`Bid ${formatPrice(option, currency)}`}
                      onClick={() => onSelectAmount?.(option)}
                    >
                      {formatBidAmount(option)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="size-11"
                    aria-label="Ketik nominal lain"
                    onClick={onEditAmount}
                  >
                    <Pencil aria-hidden />
                  </Button>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={action.disabled || bidWaiting}
                  onClick={() => onBid?.(bidAmount)}
                >
                  {bidWaiting
                    ? "Menunggu koneksi…"
                    : `Pasang Bid ${formatPrice(bidAmount, currency)}`}
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={action.disabled || bidWaiting}
                onClick={onAction}
              >
                {bidWaiting ? "Menunggu koneksi…" : action.label}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

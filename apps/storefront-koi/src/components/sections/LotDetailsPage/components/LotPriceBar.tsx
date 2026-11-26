'use client'

import { CircleCheck, Pencil } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Badge, Button } from '@koi/ui'
import { cn } from 'cn'
import { Link } from '@/components/atoms/Link/Link'
import { ROUTES } from '@/const/routes'
import { formatPrice } from '@/lib/helpers/format-price'
import type { LotBarAction } from '@/lib/helpers/lot-action'
import { formatBidAmount } from '@/lib/helpers/place-bid'

export type LotPriceBarProps = {
  // US-100 AC3: no fresh poll. Every bid control waits.
  stale?: boolean
  action?: LotBarAction
  /* The guest action is a link; the join action is a button that opens the
     page's join dialog. */
  signInHref?: string
  /* US-099 AC14: the guest footer carries AC1's copy and both guest paths, so
     the inline prompt is not repeated on the phone. */
  signUpHref?: string
  guestCopy?: string
  /* The one-line note under the join button / the highest bidder's status. */
  joinNote?: string
  onAction?: () => void
  /* US-099 AC13: a joined phone viewer picks one of the quick amounts here, and
     the button opens the confirmation sheet directly (the intermediate "Pasang
     bid" sheet is gone). The pencil asks for the typed input instead. */
  bidOptions?: number[]
  bidAmount?: number
  balance?: number | null
  currency?: string
  onSelectAmount?: (amount: number) => void
  onEditAmount?: () => void
  onBid?: (amount: number) => void
}

/* Board 02 / US-099 AC13: the phone's bottom bar carries one state's action, not
   the price again — the dark panel above always has the price and the clock.
   It also publishes its measured height as `--lot-bar-h`, which the shell
   reserves below the page content. */
const CHIP =
  'h-11 min-w-0 rounded-xl border border-outline-edge bg-background px-1 text-sm font-semibold tabular-nums shadow-none'
const CHIP_ON =
  'h-11 min-w-0 rounded-xl border-2 border-primary bg-accent px-1 text-sm font-semibold text-accent-ink tabular-nums shadow-none hover:bg-accent'

export function LotPriceBar({
  stale = false,
  action,
  signInHref,
  signUpHref,
  guestCopy,
  joinNote,
  onAction,
  bidOptions,
  bidAmount,
  balance,
  currency,
  onSelectAmount,
  onEditAmount,
  onBid
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

  const showsAction = action !== undefined && action.kind !== 'none'
  const showsBidChoices =
    action?.kind === 'bid' &&
    bidOptions !== undefined &&
    bidOptions.length > 0 &&
    bidAmount !== undefined
  // AC3: a bid is the one action held back while the price may be stale.
  const bidWaiting = stale && action?.kind === 'bid'

  const balanceLine =
    balance !== null && balance !== undefined ? (
      <span className="text-sm text-muted-foreground">
        Saldo tersedia{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {formatPrice(balance, currency)}
        </span>
      </span>
    ) : null

  return (
    <div
      ref={barRef}
      data-slot="lot-price-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pt-3 pb-4">
        {showsAction ? (
          action.kind === 'sign-in' ? (
            <div className="flex flex-col gap-3">
              {guestCopy ? (
                <p className="text-sm leading-5 text-muted-foreground">{guestCopy}</p>
              ) : null}
              <Button
                size="lg"
                render={<Link href={signInHref ?? ROUTES.login} />}
                nativeButton={false}
                className="w-full rounded-button! text-[15px]"
              >
                {action.label}
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href={signUpHref ?? ROUTES.signup} />}
                nativeButton={false}
                className="w-full rounded-button! text-[15px]"
              >
                Daftar gratis
              </Button>
            </div>
          ) : action.kind === 'highest' ? (
            <div role="status" className="flex flex-col items-center gap-1">
              <Badge variant="success" icon={<CircleCheck aria-hidden />}>
                {action.label}
              </Badge>
              {balanceLine}
              <p className="text-xs text-muted-foreground">
                Kami kirim notifikasi kalau Anda tersalip.
              </p>
            </div>
          ) : showsBidChoices ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Pilih nominal bid</span>
                {balanceLine}
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
                    variant="outline"
                    className={cn(option === bidAmount ? CHIP_ON : CHIP)}
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
                  size="icon-md"
                  className="h-11 w-12 rounded-xl"
                  aria-label="Ketik nominal lain"
                  onClick={onEditAmount}
                >
                  <Pencil aria-hidden />
                </Button>
              </div>

              <Button
                size="lg"
                className="w-full text-[15px]"
                disabled={action.disabled || bidWaiting}
                onClick={() => onBid?.(bidAmount)}
              >
                {bidWaiting
                  ? 'Menunggu koneksi…'
                  : `Pasang Bid ${formatPrice(bidAmount, currency)}`}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <Badge variant="neutral">Belum ikut</Badge>
                {balanceLine}
              </div>
              <Button
                size="lg"
                className="w-full text-[15px]"
                disabled={action.disabled || bidWaiting}
                onClick={onAction}
              >
                {bidWaiting ? 'Menunggu koneksi…' : action.label}
              </Button>
              {joinNote ? (
                <p className="text-center text-xs leading-4 text-muted-foreground">{joinNote}</p>
              ) : null}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}

import { ArrowLeft, ArrowRight, ShieldCheck, Video } from "lucide-react"

import { Button, Card, RenderIf } from "@koi/ui"
import { TRUST_CLAIMS } from "@/const/trust"
import type { CartMoney, CheckoutStep } from "@/types/cart"
import type { CartTotals, Settlement } from "@/lib/helpers/cart-totals"
import { formatDeadline } from "@/lib/helpers/format-deadline"
import { formatPrice } from "@/lib/helpers/format-price"
import { cn } from "cn"

const STEP_LABEL: Record<CheckoutStep, string> = {
  cart: "Lanjut ke pengiriman",
  shipping: "Lanjut ke pembayaran",
  payment: "Bayar sekarang",
}

export type CartSummaryProps = {
  totals: Settlement
  money?: CartMoney
  detail?: CartTotals & { parcels?: ParcelRow[] }
  step?: CheckoutStep
  onCheckout?: () => void
  onBack?: () => void
  checkoutLabel?: string
  className?: string
}

export type ParcelRow = {
  label: string
  price?: number
}

export function CartSummary({
  totals,
  money,
  detail,
  step = "cart",
  onCheckout,
  onBack,
  checkoutLabel,
  className,
}: CartSummaryProps) {
  const { items, shipping, total, due, dueRef } = totals
  const parcels = money ? undefined : detail?.parcels
  const figure = money?.total ?? total ?? items
  const settled = money !== undefined || total !== undefined
  const currency = money?.currency

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-baseline justify-between gap-4 bg-muted/60 px-5 py-3 text-sm font-bold">
          <span>Ringkasan</span>
          <span className="font-medium text-muted-foreground tabular-nums">
            {parcels?.length
              ? `${parcels.length} paket`
              : `${detail?.units ?? 0} item`}
          </span>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 text-sm">
          <RenderIf when={money}>
            {(m) => (
              <>
                <Row label="Subtotal item" value={m.items} currency={m.currency} />
                <RenderIf when={m.discount}>
                  {(amount) => (
                    <Row
                      label="Diskon"
                      value={-amount}
                      currency={m.currency}
                    />
                  )}
                </RenderIf>
                <RenderIf when={m.shipping}>
                  {(amount) => (
                    <Row label="Ongkir" value={amount} currency={m.currency} />
                  )}
                </RenderIf>
                <RenderIf when={m.shipping === undefined}>
                  {() => <Row label="Ongkir" deferred />}
                </RenderIf>
                <RenderIf when={m.tax}>
                  {(amount) => (
                    <Row label="Pajak" value={amount} currency={m.currency} />
                  )}
                </RenderIf>
              </>
            )}
          </RenderIf>

          <RenderIf when={parcels?.length ? parcels : undefined}>
            {(rows) => (
              <>
                <Row label="Subtotal item" value={items} />
                {rows.map((parcel) => (
                  <Row
                    key={parcel.label}
                    label={parcel.label}
                    value={parcel.price}
                    deferred={parcel.price === undefined}
                  />
                ))}
              </>
            )}
          </RenderIf>

          <RenderIf when={money || parcels?.length ? undefined : detail}>
            {(d) => (
              <>
                <RenderIf when={d.auction}>
                  {(amount) => <Row label="Menang lelang" value={amount} />}
                </RenderIf>
                <RenderIf when={d.direct}>
                  {(amount) => <Row label="Beli langsung" value={amount} />}
                </RenderIf>
                <RenderIf when={d.lotLines}>
                  {() => <Row label="Ongkir koi (kargo hidup)" deferred />}
                </RenderIf>
                <RenderIf when={d.goodLines}>
                  {() => <Row label="Ongkir perlengkapan" deferred />}
                </RenderIf>
              </>
            )}
          </RenderIf>

          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-4">
            <span className="font-bold">
              <RenderIf when={settled}>{() => <>Total</>}</RenderIf>
              <RenderIf when={!settled}>{() => <>Subtotal</>}</RenderIf>
            </span>
            <span className="font-heading text-2xl font-extrabold tabular-nums">
              {formatPrice(figure, currency)}
            </span>
          </div>

          <RenderIf when={!money && shipping === undefined && parcels?.length}>
            {() => (
              <p className="text-center text-xs text-muted-foreground">
                Total menyusul setelah ongkir tiap paket dihitung.
              </p>
            )}
          </RenderIf>

          <Button size="lg" onClick={onCheckout} className="w-full">
            {checkoutLabel ?? STEP_LABEL[step]}
            <ArrowRight aria-hidden />
          </Button>

          <RenderIf when={onBack}>
            {(back) => (
              <Button
                variant="link"
                onClick={back}
                className="h-auto justify-center p-0 text-sm font-semibold"
              >
                <ArrowLeft aria-hidden />
                Kembali ke keranjang
              </Button>
            )}
          </RenderIf>

          <RenderIf when={due}>
            {(at) => (
              <p className="text-center text-xs font-semibold text-destructive-ink tabular-nums">
                {dueRef} wajib dibayar sebelum {formatDeadline(at)} WIB
              </p>
            )}
          </RenderIf>
        </div>
      </Card>

      <ul className="flex flex-col">
        <TrustRow icon={ShieldCheck} claim={TRUST_CLAIMS.settled} />
        <TrustRow icon={Video} claim={TRUST_CLAIMS.doa} />
      </ul>
    </div>
  )
}

function Row({
  label,
  value,
  currency,
  deferred,
}: {
  label: string
  value?: number
  currency?: string
  deferred?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <RenderIf when={deferred}>
        {() => <span className="text-muted-foreground">Langkah 2</span>}
      </RenderIf>
      <RenderIf when={!deferred}>
        {() => (
          <span className="tabular-nums">{formatPrice(value ?? 0, currency)}</span>
        )}
      </RenderIf>
    </div>
  )
}

function TrustRow({
  icon: Icon,
  claim,
}: {
  icon: typeof ShieldCheck
  claim: { title: string; body: string }
}) {
  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
      <p className="min-w-0 text-sm leading-relaxed text-pretty">
        <strong className="font-bold">{claim.title}</strong>{" "}
        <span className="text-muted-foreground">{claim.body}</span>
      </p>
    </li>
  )
}

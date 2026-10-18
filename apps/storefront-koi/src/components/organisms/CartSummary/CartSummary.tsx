import { ArrowLeft, ArrowRight, ShieldCheck, Video } from "lucide-react"

import { Button } from "@/components/atoms/Button/Button"
import { Card } from "@/components/atoms/Card/Card"
import { TRUST_CLAIMS } from "@/const/trust"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { CheckoutStep } from "@/types/cart"
import type { CartTotals, Settlement } from "@/lib/helpers/cart-totals"
import { formatDeadline } from "@/lib/helpers/format-deadline"
import { formatPrice } from "@/lib/helpers/format-price"
import { cn } from "cn"

/** What the control says on each step. The last one is the only that takes
    money, so it is the only one that says so. */
const STEP_LABEL: Record<CheckoutStep, string> = {
  cart: "Lanjut ke pengiriman",
  shipping: "Lanjut ke pembayaran",
  payment: "Bayar sekarang",
}

/** Props for {@link CartSummary}. */
export type CartSummaryProps = {
  /** What the order comes to, as {@link Settlement} states it. A cart totals its
      own lines and passes that; the delivery step passes the landed bill. */
  totals: Settlement
  /** The settlement these rows are the detail of, where the caller has one. A
      cart shows what its two halves come to and where the freight will be
      priced; a delivery shows a row per parcel. Omitted, the rail draws the
      goods, the freight and the total it was handed. */
  detail?: CartTotals & { parcels?: ParcelRow[] }
  /** Which step the control moves to. @defaultValue `"cart"` */
  step?: CheckoutStep
  /** Called when the visitor commits to the next step. Omitted, the control
      still renders and does nothing — taking the money is the app's business. */
  onCheckout?: () => void
  /** Called when the visitor gives up and goes back. Omitted, the way back still
      renders and does nothing. */
  onBack?: () => void
  /** Replaces the control's own wording. Omitted, it names the next step. */
  checkoutLabel?: string
  className?: string
}

/** One shipment as the rail lists it: which parcel, and what its delivery
    adds. Named apart from the page's own parcel type because the rail only
    needs these two facts about it. */
export type ParcelRow = {
  label: string
  /** What it adds, in Rupiah. Omitted, the delivery is not priced yet. */
  price?: number
}

/**
 * What the order costs, what is not priced yet, and the way forward.
 *
 * @remarks
 * One rail for both steps a visitor settles on, because they are the same
 * question asked twice — what am I paying for — and two components would give
 * the figure at the foot of the page two chances to disagree with itself. What
 * changes is what the rows *know*: on the cart, delivery is a row rather than a
 * figure (the house cannot price it before it knows where the fish is going) and
 * the two halves of the bill are shown apart, because a won lot is an invoice
 * with a deadline on it and a shelf purchase is an order nothing has shipped. On
 * the delivery step the parcels are known and priced, so `detail.parcels` draws
 * a row each and the total underneath is the landed bill.
 */
export function CartSummary({
  totals,
  detail,
  step = "cart",
  onCheckout,
  onBack,
  checkoutLabel,
  className,
}: CartSummaryProps) {
  const { items, shipping, total, due, dueRef } = totals
  const parcels = detail?.parcels
  /* What the visitor is actually asked for: the landed bill where the freight
     is known, the goods alone where it is not. */
  const figure = total ?? items

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
          {/* One row per parcel where the delivery step has assembled them: the
              freight belongs to a shipment, and a single "Ongkir" would hide
              that a fish and a sack of food travel differently. */}
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

          {/* The cart's own two halves and its two unpriced deliveries — the
              rows the delivery step replaces once it knows the parcels. */}
          <RenderIf when={parcels?.length ? undefined : detail}>
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
              <RenderIf when={total !== undefined}>{() => <>Total</>}</RenderIf>
              <RenderIf when={total === undefined}>
                {() => <>Subtotal</>}
              </RenderIf>
            </span>
            <span className="font-heading text-2xl font-extrabold tabular-nums">
              {formatPrice(figure)}
            </span>
          </div>

          {/* Freight known but not quoted for every parcel: the total cannot be
              stated, and saying so is the only honest thing the rail can do. A
              figure here would change after the visitor agreed to it. */}
          <RenderIf when={shipping === undefined && parcels?.length}>
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

          {/* The way back, under the way forward: a visitor who has changed their
              mind about the cart is one step from it, not stuck. */}
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

          {/* The last chance to say it before the coin: which lot the hurry is
              about, and when it runs out. */}
          <RenderIf when={due}>
            {(at) => (
              <p className="text-center text-xs font-semibold text-destructive-ink tabular-nums">
                {dueRef} wajib dibayar sebelum {formatDeadline(at)} WIB
              </p>
            )}
          </RenderIf>
        </div>
      </Card>

      {/* What backs the money, on the panel that spends it. Two lines rather
          than `LotTrustList`'s list, because a cart's question is not a lot's:
          here the visitor is settling a bill, so the first thing to say is what
          paying unlocks. */}
      <ul className="flex flex-col">
        <TrustRow icon={ShieldCheck} claim={TRUST_CLAIMS.settled} />
        <TrustRow icon={Video} claim={TRUST_CLAIMS.doa} />
      </ul>
    </div>
  )
}

/** One line of the rail: a claim on the left, its figure on the right. */
function Row({
  label,
  value,
  deferred,
}: {
  label: string
  /** The amount, in Rupiah. Omitted with `deferred`. */
  value?: number
  /** Priced later, in the second step — drawn as a note rather than an amount,
      because the house cannot quote a delivery before it knows where the fish
      is going. A `Rp 0` here would read as free shipping. */
  deferred?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <RenderIf when={deferred}>
        {() => <span className="text-muted-foreground">Langkah 2</span>}
      </RenderIf>
      <RenderIf when={!deferred}>
        {() => <span className="tabular-nums">{formatPrice(value ?? 0)}</span>}
      </RenderIf>
    </div>
  )
}

/** One line of what backs the money: a glyph, a claim, and its condition. */
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

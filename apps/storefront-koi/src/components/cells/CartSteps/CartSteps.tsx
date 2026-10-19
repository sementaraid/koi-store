import { Check } from "lucide-react"

import { cn } from "cn"

import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { CheckoutStep } from "@/types/cart"

/** The three steps, in the order the visitor walks them. */
export const CHECKOUT_STEPS = [
  "cart",
  "shipping",
  "payment",
] as const satisfies readonly CheckoutStep[]

/** What each is called, as the indicator words it. */
const LABEL: Record<CheckoutStep, string> = {
  cart: "Keranjang",
  shipping: "Pengiriman",
  payment: "Konfirmasi & bayar",
}

/** Props for {@link CartSteps}. */
export type CartStepsProps = {
  /** Where the visitor is. Steps before this are drawn done, this one current. */
  step: CheckoutStep
  /** Steps *after* this one that are also behind the visitor — a page that can
      be reached from anywhere, or a review screen walked back to. Omitted,
      everything before `step` is what is done. */
  done?: CheckoutStep[]
  className?: string
}

/**
 * Where the visitor is in settling up: cart, delivery, payment.
 *
 * @remarks
 * Three steps and the money is the last of them, because the house prices
 * delivery before it asks to be paid — a koi flies air cargo and a sack of food
 * does not, so shipping is a step with a number in it rather than a field on the
 * payment form.
 *
 * The current step is marked by fill and `aria-current`, not by colour alone:
 * the difference between "Keranjang" and "Pengiriman" here is a filled disc
 * against a hollow one, which survives a monochrome screen and a colour-blind
 * reader.
 *
 * Only the current step is numbered: a step the visitor has behind them shows a
 * tick instead, so the number they are on is the only figure in the row.
 */
export function CartSteps({ step, done, className }: CartStepsProps) {
  const at = CHECKOUT_STEPS.indexOf(step)

  return (
    <ol
      aria-label="Langkah checkout"
      className={cn(
        "flex flex-wrap items-center text-xs font-semibold text-muted-foreground",
        className
      )}
    >
      {CHECKOUT_STEPS.map((value, i) => {
        const current = i === at
        const past = i < at || (done?.includes(value) ?? false)

        return (
          <li key={value} className="flex items-center">
            {/* The rule hangs off the second and third steps rather than sitting
                between them, so the list has no orphan node between its items. */}
            <RenderIf when={i > 0}>
              {() => (
                <span
                  aria-hidden
                  className="mx-2.5 h-px w-8 bg-border"
                  data-done={past || current}
                />
              )}
            </RenderIf>

            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                current && "text-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5.5 items-center justify-center rounded-full text-xs tabular-nums",
                  current
                    ? "bg-primary font-bold text-primary-foreground"
                    : "border border-border"
                )}
              >
                <RenderIf when={past && !current}>
                  {() => <Check aria-hidden className="size-3" />}
                </RenderIf>
                <RenderIf when={!past || current}>{() => i + 1}</RenderIf>
              </span>
              {LABEL[value]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

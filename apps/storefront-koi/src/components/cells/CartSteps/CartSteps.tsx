import { Check } from "lucide-react"

import { cn } from "cn"

import { RenderIf } from "@koi/ui"
import type { CheckoutStep } from "@/types/cart"

export const CHECKOUT_STEPS = [
  "cart",
  "shipping",
  "payment",
] as const satisfies readonly CheckoutStep[]

const LABEL: Record<CheckoutStep, string> = {
  cart: "Keranjang",
  shipping: "Pengiriman",
  payment: "Konfirmasi & bayar",
}

export type CartStepsProps = {
  step: CheckoutStep
  done?: CheckoutStep[]
  className?: string
}

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

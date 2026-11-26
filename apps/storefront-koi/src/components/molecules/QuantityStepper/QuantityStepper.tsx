import { Minus, Plus } from "lucide-react"

import { Button } from "@koi/ui"
import { cn } from "cn"

export type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  /* Undefined leaves the upper end open (untracked stock). */
  max?: number
  disabled?: boolean
  label?: string
  className?: string
}

/* The cart line's minus/value/plus, shared by the buy box and the phone bar.
   Values stay whole and inside [min, max], so a tap never sends a bad quantity
   to the cart. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  label = "Jumlah",
  className,
}: QuantityStepperProps) {
  const clamp = (next: number) =>
    Math.min(Math.max(Math.floor(next), min), max ?? Number.POSITIVE_INFINITY)

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center rounded-control border border-outline-edge",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-md"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Kurangi jumlah"
      >
        <Minus aria-hidden />
      </Button>
      <span
        className="min-w-7 text-center text-sm font-bold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-md"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Tambah jumlah"
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}

import { RenderIf } from "@koi/ui"
import { formatPrice } from "@/lib/helpers/format-price"
import { cn } from "cn"

export type ChoiceOption = {
  id: string
  title: string
  detail?: string
  price?: number
  tag?: string
  deferred?: boolean
}

export type ChoiceListProps = {
  options: ChoiceOption[]
  value?: string
  onValueChange?: (id: string) => void
  label: string
  className?: string
}

export function ChoiceList({
  options,
  value,
  onValueChange,
  label,
  className,
}: ChoiceListProps) {
  return (
    <fieldset className={cn("flex flex-col", className)}>
      <legend className="sr-only">{label}</legend>

      {options.map((option) => {
        const selected = option.id === value

        return (
          <label
            key={option.id}
            data-slot="choice"
            data-selected={selected}
            className={cn(
              "flex w-full cursor-pointer items-start gap-3.5 rounded-xl p-3.5 text-start transition-colors",
              selected ? "bg-primary/5" : "hover:bg-muted/60"
            )}
          >
            <input
              type="radio"
              name={label}
              value={option.id}
              checked={selected}
              onChange={() => onValueChange?.(option.id)}
              className="peer sr-only"
            />

            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                selected ? "border-primary" : "border-input"
              )}
            >
              <RenderIf when={selected}>
                {() => <span className="size-2 rounded-full bg-primary" />}
              </RenderIf>
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                {option.title}
                <RenderIf when={option.tag}>
                  {(tag) => (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      {tag}
                    </span>
                  )}
                </RenderIf>
              </span>
              <RenderIf when={option.detail}>
                {(detail) => (
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {detail}
                  </span>
                )}
              </RenderIf>
            </span>

            <RenderIf when={option.price !== undefined || option.deferred}>
              {() => (
                <span className="shrink-0 font-bold tabular-nums">
                  {option.deferred || option.price === undefined
                    ? "Ongkir menyusul"
                    : formatPrice(option.price ?? 0)}
                </span>
              )}
            </RenderIf>
          </label>
        )
      })}
    </fieldset>
  )
}

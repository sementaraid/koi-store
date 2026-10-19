import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import { formatPrice } from "@/lib/helpers/format-price"
import { cn } from "cn"

/** One thing the visitor can pick: what it is, what that means, what it costs. */
export type ChoiceOption = {
  id: string
  /** The line the visitor is choosing between. */
  title: string
  /** What it means in practice. Omitted, the row is its title and its price. */
  detail?: string
  /** What it adds, in Rupiah. Omitted, nothing is quoted — see `deferred`. */
  price?: number
  /** A tag beside the title — `"Utama"`, `"Farm"`. */
  tag?: string
  /** Not quoted yet, drawn as a note rather than an amount. A `Rp 0` would read
      as free. */
  deferred?: boolean
}

/** Props for {@link ChoiceList}. */
export type ChoiceListProps = {
  /** What the visitor may pick between. */
  options: ChoiceOption[]
  /** Which one is taken. */
  value?: string
  /** Called with the one picked. Omitted, the rows still render and report
      nothing. */
  onValueChange?: (id: string) => void
  /** Names the group for a screen reader. */
  label: string
  className?: string
}

/**
 * A list of things to pick one of: an address, a way for a fish to fly, a
 * courier.
 *
 * @remarks
 * One component for three choosers because they are one act — read a few lines,
 * take one — and the difference between them is what the lines say, which is
 * `ChoiceOption`'s job rather than a second component's. The cart's design draws
 * all three the same way, and three components would give the page three chances
 * to disagree about how tall a row is.
 *
 * A `<fieldset>` of radios rather than a row of buttons: it is a choice with an
 * answer that persists, and a screen reader should hear how many there are, that
 * they are exclusive, and which one is on.
 *
 * The chosen row is marked by fill *and* a filled dot, not by colour alone,
 * which survives a monochrome screen.
 */
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
              /* A tint of the brand rather than a grey wash: the kit's own
                 "chosen" idiom (`ui/field`). Grey at this lightness is the same
                 row on a light page and a different one in dark mode. */
              selected ? "bg-primary/5" : "hover:bg-muted/60"
            )}
          >
            <input
              type="radio"
              name={label}
              value={option.id}
              checked={selected}
              onChange={() => onValueChange?.(option.id)}
              /* The ring is drawn from the input's own state, so the focus ring
                 lands on the control the keyboard is actually on. */
              className="peer sr-only"
            />

            {/* The dot: outlined until chosen, then filled. Draws the same in
                monochrome, which is the whole reason it is a shape. */}
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

            {/* The figure, where there is one. Not quoted yet reads as a note —
                "the house has not said" rather than "the house says zero". */}
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

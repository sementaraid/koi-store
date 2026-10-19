import { isValidElement } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import {
  GLOSS,
  PRESS,
  PRESS_IN,
  RAISED,
  SURFACE,
} from "@/const/surface"

/* koi button: soft pill, layered shadow with a top sheen, springs down on press. */

/* link resets must be emitted after `size`, so they live in compoundVariants */
const LINK = "h-auto bg-transparent px-0 shadow-none"

/* focus ring is drawn outside the button, so it needs the tone's *ink* colour
   (readable on the page background), not the fill colour. */
const FOCUS_ACCENT = "focus-visible:ring-accent-ink/30"
const FOCUS_NEUTRAL = "focus-visible:ring-foreground/30"
const FOCUS_DANGER = "focus-visible:ring-destructive-ink/30"

const buttonVariants = cva(
  /* per-property easing: the spring overshoots (y1 = 1.42), which is what makes
     the release snap. On colour it is wrong — the browser extrapolates past the
     target, so a transparent → tinted hover (ghost) flashes twice. Spring stays
     on transform only; everything else eases out.
     Written as an arbitrary `transition` shorthand: Tailwind's `transition-[…]`
     only fills `transition-property`, and shorthand syntax is invalid there. */
  "group/button relative isolate inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap outline-none select-none [transition:transform_150ms_cubic-bezier(0.34,1.42,0.64,1),box-shadow_150ms_ease-out,background-color_150ms_ease-out,color_150ms_ease-out,filter_150ms_ease-out] focus-visible:ring-[3px] disabled:pointer-events-none disabled:transform-none disabled:opacity-50 disabled:shadow-none motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      /* one axis: `variant` = tone + emphasis baked together.
         bare soft/outline/ghost = neutral tone; `accent-` = brand tone;
         `destructive-` = danger tone. `solid` (brand fill) and `link` (brand
         text) are the two bare names that carry the brand tone themselves. */
      variant: {
        solid: `${SURFACE} ${FOCUS_ACCENT} bg-primary text-primary-foreground hover:bg-primary/90`,
        soft: `bg-muted text-foreground ${PRESS} ${FOCUS_NEUTRAL} hover:bg-muted/70`,
        outline: `${GLOSS} ${RAISED} ${PRESS} ${PRESS_IN} ${FOCUS_NEUTRAL} border border-foreground/20 bg-background text-accent-ink hover:bg-muted dark:border-0 dark:bg-foreground/10 dark:hover:bg-foreground/15`,
        ghost: `text-foreground hover:bg-muted ${FOCUS_NEUTRAL}`,
        link: `text-accent-ink underline-offset-4 hover:underline ${FOCUS_ACCENT}`,
        neutral: `${SURFACE} ${FOCUS_NEUTRAL} bg-foreground text-background hover:bg-foreground/90`,
        destructive: `${SURFACE} ${FOCUS_DANGER} bg-destructive text-background hover:bg-destructive/90 dark:bg-[color-mix(in_oklch,var(--destructive),black_30%)] dark:text-white dark:hover:bg-[color-mix(in_oklch,var(--destructive),black_20%)]`,
      },
      size: {
        xs: "h-6 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-[13px]",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-[15px]",
        xl: "h-12 px-6 text-base",
        "icon-xs": "size-6 gap-0 px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 gap-0 px-0",
        "icon-md": "size-9 gap-0 px-0",
        "icon-lg": "size-11 gap-0 px-0",
        "icon-xl": "size-12 gap-0 px-0",
      },
    },
    /* link resets must land after `size` (which sets h-9/px-4), so they live
       here — compoundVariants are emitted last.
       The bare pair repeats its `text-foreground` here so it is emitted after
       `size` and after any per-call `className` ordering, keeping the neutral
       ink pinned if an ancestor tints the button brand-red. */
    compoundVariants: [
      { variant: "link", class: LINK },
      { variant: ["soft", "ghost"], class: "text-foreground" },
    ],
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  render,
  /* `render` swaps the element out — usually for a `Link`, i.e. an `<a>`. Base UI
     assumes a native `<button>` unless told otherwise and warns about the lost
     semantics, so infer it here instead of making every call site repeat
     `nativeButton={false}`. Only a literal `<button>` stays native. */
  nativeButton = !render || !isValidElement(render) || render.type === "button",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      render={render}
      nativeButton={nativeButton}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }

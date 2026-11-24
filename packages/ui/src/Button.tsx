import { isValidElement } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* koi button: flat, 1 px edge where it has one, no shadow. Heights follow the
   design: 48 px on a phone; on desktop 40 default (`md`), 48 large (`lg`), 32
   small (`sm`). Controls shorter than 44 px on a phone keep their look and grow
   an invisible hit area to 44 px with `after:` (the button is `relative`). */

/* link resets must be emitted after `size`, so they live in compoundVariants */
const LINK = "h-auto bg-transparent px-0"

const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      /* one axis: `variant` = tone + emphasis baked together.
         bare soft/outline/ghost = neutral tone; `solid` is the brand fill,
         `link` the brand text, `destructive` the signal red. */
      variant: {
        solid: "bg-primary text-primary-foreground hover:bg-primary/90",
        soft: "bg-secondary text-foreground hover:bg-divider",
        outline:
          "border border-input bg-background text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        link: "text-accent-ink underline-offset-4 hover:underline",
        neutral: "bg-foreground text-background hover:bg-foreground/90",
        destructive:
          "bg-destructive text-signal-foreground hover:bg-destructive/90",
      },
      size: {
        xs: "h-6 gap-1 px-3 text-xs max-md:after:absolute max-md:after:top-1/2 max-md:after:left-1/2 max-md:after:h-11 max-md:after:w-full max-md:after:min-w-11 max-md:after:-translate-1/2 max-md:after:content-[''] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-sm max-md:after:absolute max-md:after:-inset-y-1.5 max-md:after:inset-x-0 max-md:after:content-['']",
        md: "h-12 px-4 text-base md:h-10 md:text-sm",
        lg: "h-12 px-5 text-base",
        xl: "h-12 px-6 text-base",
        "icon-xs":
          "size-6 gap-0 px-0 max-md:after:absolute max-md:after:-inset-2.5 max-md:after:content-[''] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 gap-0 px-0 max-md:after:absolute max-md:after:-inset-1.5 max-md:after:content-['']",
        "icon-md": "size-12 gap-0 px-0 md:size-10",
        "icon-lg": "size-12 gap-0 px-0",
        "icon-xl": "size-12 gap-0 px-0",
      },
    },
    /* link resets must land after `size` (which sets the height and padding),
       so they live here: compoundVariants are emitted last. The bare pair
       repeats `text-foreground` so it stays pinned if an ancestor tints it. */
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

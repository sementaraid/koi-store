import type { ComponentProps } from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  /* `filled` is the redesign's filter field (design `.sel`): 44 px, no edge, a
     grey fill, 12 px radius, 16 px text. `outline` stays the form field. */
  variant?: "outline" | "filled"
}

function NativeSelect({
  className,
  size = "default",
  variant = "outline",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
      data-variant={variant}
    >
      <select
        data-slot="native-select"
        data-size={size}
        data-variant={variant}
        className="h-12 w-full min-w-0 appearance-none rounded-control md:h-10 border border-input bg-transparent py-1 ps-2.5 pe-8 text-sm transition-[color,box-shadow] outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:data-[size=sm]:h-8 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[variant=filled]:h-11 data-[variant=filled]:rounded-field data-[variant=filled]:border-0 data-[variant=filled]:bg-field data-[variant=filled]:ps-3.5 data-[variant=filled]:pe-10 data-[variant=filled]:text-base"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground select-none group-data-[variant=filled]/native-select:end-3.5 group-data-[variant=filled]/native-select:text-field-icon"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ className, ...props }: ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }

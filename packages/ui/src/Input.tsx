import type { ComponentProps } from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-field border-0 bg-field px-4 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:bg-accent focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-destructive/5 aria-invalid:ring-[1.5px] aria-invalid:ring-destructive aria-invalid:ring-inset md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

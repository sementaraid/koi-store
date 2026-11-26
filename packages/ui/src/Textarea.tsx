import type { ComponentProps } from "react"
import { cn } from "cn"

/** The filled multi-line field (design `textarea`): 12 px radius, no edge, a
    grey fill, 15 px text on desktop and 16 px on the phone. */
function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 resize-y rounded-field border-0 bg-field px-4 py-3 text-base leading-[22px] transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:bg-accent focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-destructive/5 aria-invalid:ring-[1.5px] aria-invalid:ring-destructive aria-invalid:ring-inset md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

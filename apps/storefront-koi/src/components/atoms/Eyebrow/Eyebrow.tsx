import type { ReactNode } from "react"
import { cn } from "cn"

/** Props for {@link Eyebrow}. */
export type EyebrowProps = {
  /** The text, and the glyph that reads with it. */
  children: ReactNode
  className?: string
}

/**
 * The small caps label above a page's or a section's heading: what the block
 * below is, said before it is said at size.
 *
 * @remarks
 * Four pages drew this by hand, identically, which is the tell that it is a
 * component and not a habit. It is drawn in `accent-ink` — the tone the kit
 * reserves for a label that leads — where a section's own heading inside a page
 * is quiet (`SECTION_LABEL`), so rank is legible without reading the words.
 *
 * @example
 * <Eyebrow>
 *   <Gavel aria-hidden className="size-3.5" />
 *   Katalog Lelang
 * </Eyebrow>
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-2xs font-bold tracking-widest text-accent-ink uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}

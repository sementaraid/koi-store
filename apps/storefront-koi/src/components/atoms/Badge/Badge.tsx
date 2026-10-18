import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* koi badge: a flat fact chip, not a control. The button and the card carry the
   kit's convex material (gloss, bevel, standoff); the badge deliberately carries
   none of it — no shadow, no lift, no press — so at a glance it reads as a
   statement about a lot rather than something to click, and never competes with
   the deep indigo CTA sitting beside it.

   Six tones, one per fact class rather than one per label:
   - `neutral`   default. Live states at rest (Upcoming) and catalogue facts
                 (koi variety, listing attributes).
   - `muted`     no longer actionable: Ended, Sold, Unsold.
   - `live`      bidding is open — the one signal a bidder must not miss.
   - `urgent`    closing soon.
   - `info`      a fact the buyer should read, carrying no urgency and no
                 praise: provenance paperwork, shipping origin, sex. Cool blue,
                 deliberately between the `live` red and `attention` gold so it
                 reads as "worth knowing", not "act now".
   - `attention` earned distinction: house trust flags and bidding highlights.
   Distinctions *inside* a tone (Verified breeder vs Top bid vs Popular) are
   carried by the icon the call site passes, not by a colour of their own. */

const badgeVariants = cva(
  /* The edge is a single inset hairline, so it lands on the fill's own edge —
     there is no border for the fill to disagree with, and no second ring. */
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap inset-ring-1 inset-ring-black/10 dark:inset-ring-white/15 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        /* Broadcast red rather than the green this tone used to carry: the pill
           sits on a lot photo, where a pale tint lost the "bidding is open"
           signal to whatever the koi was swimming against. */
        live: "bg-[oklch(0.94_0.06_25)] text-live-ink dark:bg-[oklch(0.30_0.08_25)]",
        info: "bg-[oklch(0.93_0.05_245)] text-[oklch(0.40_0.12_250)] dark:bg-[oklch(0.28_0.05_250)] dark:text-[oklch(0.85_0.10_245)]",
        urgent: "bg-destructive/10 text-destructive-ink dark:bg-destructive/20",
        /* the house's own colour, the same gold the Top Breeder pill has always
           used — it reads on a photo where a neutral tint would not. */
        attention:
          "bg-[oklch(0.84_0.14_85)] text-[oklch(0.29_0.07_75)] dark:bg-[oklch(0.72_0.14_80)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

/* koi material: the physical treatment koi surfaces share (button, card, and
   whatever comes next). Class strings only — no React, no imports. */

/* convex shading: top light, mid flat, bottom shade. Real buttons are
   cylinders lit from above — flat fill is what reads as "flat". */
export const GLOSS =
  "bg-[linear-gradient(to_bottom,oklch(1_0_0/18%),oklch(1_0_0/0)_80%,oklch(0_0_0/14%))]"

/* hairline top highlight + tight contact shadow + soft ambient */
export const RAISED =
  "shadow-[inset_0_1px_0_oklch(1_0_0/25%),0_1px_2px_oklch(0_0_0/12%),0_2px_4px_-1px_oklch(0_0_0/12%),0_8px_16px_-8px_oklch(0_0_0/20%)]"

/* grid tile: deeper standoff than RAISED — tiles sit in a grid on a long page
   and need to read as lifted from further up than a lone panel. Same hairline
   top highlight, so the material still matches. */
export const TILE =
  "shadow-[inset_0_1px_0_oklch(1_0_0/25%),0_1px_2px_oklch(0_0_0/10%),0_4px_8px_-2px_oklch(0_0_0/12%),0_16px_32px_-12px_oklch(0_0_0/24%)]"

/* pressed-control lift: only interactive surfaces hover-lift, so it is opt-in
   rather than part of RAISED. */
export const LIFT =
  "hover:-translate-y-px hover:brightness-[1.06] hover:shadow-[inset_0_1px_0_oklch(1_0_0/30%),0_2px_3px_oklch(0_0_0/14%),0_4px_8px_-2px_oklch(0_0_0/14%),0_12px_24px_-10px_oklch(0_0_0/26%)]"

/* press: sink to the surface, drop the lift, invert the shadow to an inset.
   Press-in overrides the base duration/easing, so the down-stroke is a fast
   snap (75ms ease-out) while the release falls back to the button's spring. */
export const PRESS =
  "active:not-aria-[haspopup]:translate-y-0 active:not-aria-[haspopup]:scale-[0.98] active:not-aria-[haspopup]:[transition-duration:75ms] active:not-aria-[haspopup]:[transition-timing-function:ease-out]"
export const PRESS_IN =
  "active:not-aria-[haspopup]:shadow-[inset_0_2px_5px_oklch(0_0_0/22%),inset_0_1px_0_oklch(1_0_0/6%)]"

/* koi edges are drawn inside the surface (inset ring) instead of as a border,
   so the geometry never shifts between tones. `ring-0` cancels the shadcn
   outer ring that wrapped components (ui/card) ship with; it is a no-op on
   components that have none. */
export const RING = "ring-0 inset-ring-1 inset-ring-black/20"

/* the full "physical" treatment: convex fill, bevel edge, standoff, depression */
export const SURFACE = `${GLOSS} ${RAISED} ${LIFT} ${RING} ${PRESS} ${PRESS_IN}`

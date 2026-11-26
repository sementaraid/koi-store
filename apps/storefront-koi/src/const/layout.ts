
/* US-103 AC9: 1216 px of content at 1440 px (1280 - 2×32), the board 08 column.
   Phones keep the 16 px gutter. */
export const CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-8"

/* US-095 label: 12 px, uppercase, 700. The board sets section labels in the
   foreground colour, not grey. */
export const SECTION_LABEL =
  "text-xs font-bold tracking-widest text-foreground uppercase"

/* US-107 AC11: the Bid Saya content column stays at least a viewport tall.
   Empty, one and two bid cards are all shorter than the viewport, so the footer
   sits at the same place during the skeleton and after the list loads, and it
   does not rise into view when the account home is replaced by this route. The
   route skeleton (AccountSkeleton) and the page (AccountFrame) both apply it.
   The 4rem keeps the footer below the fold once the header and the frame's
   vertical padding are added. */
export const BID_SAYA_CONTENT = "min-h-[calc(100svh-4rem)]"

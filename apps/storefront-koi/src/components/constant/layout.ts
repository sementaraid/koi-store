/* The page frame koi pages share. Class strings only — no React, no imports. */

/* One column, one gutter: the header, the bands, the page bodies and the footer
   all line up on it, so a page cannot drift an edge away from the bar above it.
   Every page used to declare its own copy of this string, which is exactly how
   two pages end up with two gutters. */
export const CONTAINER = "mx-auto w-full max-w-[1200px] px-4 sm:px-6"

/* A section's name over its body: small, spaced, quiet. One string, because a
   heading that sits a hair heavier on one page than the next reads as a
   different rank of heading, and the pages already disagreed about the colour. */
export const SECTION_LABEL =
  "text-2xs font-bold tracking-widest text-muted-foreground uppercase"

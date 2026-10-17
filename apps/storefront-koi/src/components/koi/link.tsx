import type { ComponentProps } from "react"
import NextLink from "next/link"
import { cn } from "cn"

/* koi link: an anchor you can style. Deliberately bare — it carries no tone and
   no underline, because every koi link so far is a nav item or a menu row whose
   surrounding component already decides how it looks. The point is not the CSS
   (this is two lines of it) but the seam: the router arrived, so this is the one
   file that changed, instead of every `<a>` in the kit.

   `href` is optional on an `<a>` but required by `next/link`, so a link without
   one falls back to a plain anchor rather than throwing — the kit renders a few
   as placeholders. */

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: ComponentProps<typeof NextLink>["href"]
}

function Link({ className, href, ...props }: LinkProps) {
  const cls = cn("outline-none", className)

  if (href === undefined) {
    return <a data-slot="link" className={cls} {...(props as ComponentProps<"a">)} />
  }

  return <NextLink data-slot="link" href={href} className={cls} {...props} />
}

export { Link }

import type { ComponentProps } from "react"
import NextLink from "next/link"
import { cn } from "cn"

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: ComponentProps<typeof NextLink>["href"]
}

function Link({ className, href, ...props }: LinkProps) {
  /* Inline text links have no usable default focus indicator once the browser
     outline is removed, so draw the same ring the Button uses, small enough to
     hug the text. Callers keep control through `cn`: a caller drawing its own
     ring (e.g. a card-wide `after:` ring) overrides this with
     `focus-visible:ring-0 focus-visible:ring-offset-0`. */
  const cls = cn(
    "rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
    className
  )

  if (href === undefined) {
    return <a data-slot="link" className={cls} {...(props as ComponentProps<"a">)} />
  }

  return <NextLink data-slot="link" href={href} className={cls} {...props} />
}

export { Link }

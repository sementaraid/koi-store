import type { ComponentProps } from "react"
import NextLink from "next/link"
import { cn } from "cn"

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

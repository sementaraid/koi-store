"use client"

import { usePathname } from "next/navigation"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { ROUTES } from "@/const/routes"
import { activeNavHref } from "@/lib/helpers/nav-active"
import type { HeaderLink } from "@/types/header"

// Category and product pages sit under Katalog Koi, as they always did.
const ALIASES = { [ROUTES.catalogs]: [ROUTES.categories, "/produk"] }

export function NavLinks({
  links,
  markActive = true,
}: {
  links: HeaderLink[]
  markActive?: boolean
}) {
  const pathname = usePathname()
  const activeHref = markActive
    ? activeNavHref(
        pathname,
        links.map((link) => link.href),
        ALIASES
      )
    : undefined

  return (
    <div className="flex items-center gap-1">
      {links.map(({ label, href, live }) => {
        const active = href === activeHref
        return (
          <Button
            key={href}
            render={<Link href={href} />}
            nativeButton={false}
            variant="link"
            size="sm"
            aria-current={active ? "page" : undefined}
            className={cn(
              "gap-1.5 px-2 text-xs",
              active
                ? "font-bold text-accent-ink"
                : "text-muted-foreground hover:text-accent-ink"
            )}
          >
            <RenderIf when={live}>{() => <PulseIcon />}</RenderIf>
            {label}
          </Button>
        )
      })}
    </div>
  )
}

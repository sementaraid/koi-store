import { cn } from "cn"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { RenderIf } from "@/components/module/render-if"
import { PulseIcon } from "./pulse-icon"
import type { HeaderLink } from "@/components/types/header"

/**
 * Desktop nav: text links, the live one wearing the pulse. Below `lg` it is
 * gone — those destinations live in the bottom nav.
 */
export function NavLinks({
  links,
  activeHref,
}: {
  links: HeaderLink[]
  activeHref?: string
}) {
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
              /* The footer's link row, lifted onto the bar: quiet size, muted
                 at rest, spending the brand accent on interaction — plus the
                 current page, the other thing the accent marks. */
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

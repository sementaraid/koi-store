import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "cn"

/** One step of the trail. Everything but the last is a link. */
export type Crumb = {
  label: string
  /** Omitted, the step is plain text — the session a lot runs in is not a page
      the house publishes, so it names itself and goes nowhere. */
  href?: string
}

/** Props for {@link PageBreadcrumb}. */
export type PageBreadcrumbProps = {
  /** The trail, floor first, current page last. The last step is drawn as the
      page itself — a link to where the visitor already is is furniture. */
  trail: Crumb[]
  className?: string
}

/**
 * Where the page sits: the floor, the session it runs in, the lot, and — in the
 * room — the room.
 *
 * @remarks
 * Drawn by `PageShell`, not by each page, so every page that walks a trail walks
 * the same one: its gutter and the gap under it come from one place, and a page
 * says only what its own steps are. Four pages used to hand this component their
 * trail at four different depths in their markup, which is how one of them ends
 * up with a breadcrumb the page's own padding has already pushed off the gutter.
 *
 * It carries its own margin so it can stand alone in a page body; the shell,
 * which puts the body's padding under it, turns that margin off rather than
 * stacking the two.
 *
 * `trail` is a list rather than a fixed depth because a surface with more to say
 * about its own position says it by adding a step — the room adds `"Ruang
 * bidding"` to a lot's three rather than drawing a second bar.
 */
export function PageBreadcrumb({ trail, className }: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={cn("mb-5", className)}>
      <BreadcrumbList className="text-xs">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

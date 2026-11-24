import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@koi/ui/primitives/breadcrumb"
import { cn } from "cn"
import { RenderIf } from "@koi/ui"

import { CONTAINER } from "@/const/layout"

export type Crumb = {
  label: string
  href?: string
}

export type PageBreadcrumbProps = {
  trail: Crumb[]
  className?: string
}

export function PageBreadcrumb({ trail, className }: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={cn("mb-5", className)}>
      <BreadcrumbList className="text-xs">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              <RenderIf when={i > 0}>{() => <BreadcrumbSeparator />}</RenderIf>
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

/**
 * The breadcrumb at the top of a page's content, in the page container. Pages
 * render it themselves now that the layout owns the shell (US-107).
 */
export function PageTrail({
  trail,
  className,
}: PageBreadcrumbProps) {
  return (
    <div className={cn(CONTAINER, "pt-5", className)}>
      <PageBreadcrumb trail={trail} className="mb-0" />
    </div>
  )
}

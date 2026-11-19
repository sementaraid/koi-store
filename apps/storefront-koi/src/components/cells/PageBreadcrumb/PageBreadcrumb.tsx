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

import type { ReactNode } from "react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@koi/ui/primitives/empty"

export type EmptyFeedProps = {
  icon: ReactNode
  noMatchTitle: string
  noMatchBody: string
  emptyTitle?: string
  emptyBody?: string
  narrowing: boolean
  onReset?: () => void
  action?: ReactNode
  className?: string
  /** Extra classes for the icon disc, e.g. the account pages' 64 px circle. */
  iconClassName?: string
  titleClassName?: string
}

export function EmptyFeed({
  icon,
  noMatchTitle,
  noMatchBody,
  emptyTitle,
  emptyBody,
  narrowing,
  onReset,
  action,
  className,
  iconClassName,
  titleClassName,
}: EmptyFeedProps) {
  return (
    <Empty
      className={cn(
        "border border-dashed border-border bg-muted/20",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className={iconClassName}>
          {icon}
        </EmptyMedia>
        <EmptyTitle className={titleClassName}>
          {narrowing ? noMatchTitle : (emptyTitle ?? noMatchTitle)}
        </EmptyTitle>
        <EmptyDescription>
          {narrowing ? noMatchBody : (emptyBody ?? noMatchBody)}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <RenderIf when={narrowing ? onReset : undefined}>
          {(reset) => (
            <Button variant="outline" onClick={reset}>
              Reset filter
            </Button>
          )}
        </RenderIf>
        <RenderIf when={action}>{(node) => node}</RenderIf>
      </EmptyContent>
    </Empty>
  )
}

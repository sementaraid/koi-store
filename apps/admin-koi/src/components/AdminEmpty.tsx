import type { ReactNode } from 'react';
import { cn } from 'cn';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@koi/ui/primitives/empty';

// The admin app's one empty state, modelled on the storefront's `EmptyFeed`:
// icon, title, description and an optional action. Used inside queue cards and
// full-page sections so an empty list never reads as a bare sentence.
export type AdminEmptyProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  role?: 'alert' | 'status';
  className?: string;
};

export function AdminEmpty({
  title,
  description,
  action,
  icon,
  role,
  className
}: AdminEmptyProps) {
  return (
    <Empty
      role={role}
      className={cn('border border-dashed border-border bg-muted/20 p-6', className)}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <InboxIcon />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from 'cn';

import { Card, RenderIf } from "@koi/ui";
import { SECTION_LABEL } from '@/const/layout';

export type StatCardProps = {
  label: string;
  icon?: LucideIcon;
  value: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  icon: Icon,
  value,
  note,
  action,
  className
}: StatCardProps) {
  return (
    <Card className={cn('gap-0 p-5 [--card-spacing:--spacing(0)]', className)}>
      <p className={cn(SECTION_LABEL, 'flex items-center gap-1.5')}>
        <RenderIf when={Icon}>
          {(Glyph) => (
            <Glyph
              aria-hidden
              className="size-3.5 text-accent-ink"
            />
          )}
        </RenderIf>
        {label}
      </p>

      <p className="mt-2 font-heading text-xl font-extrabold text-foreground tabular-nums">
        {value}
      </p>

      <RenderIf when={note}>
        {(text) => (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
        )}
      </RenderIf>

      <RenderIf when={action}>
        {(node) => <div className="mt-3 text-sm">{node}</div>}
      </RenderIf>
    </Card>
  );
}

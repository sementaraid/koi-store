import type { ReactNode } from 'react';
import { cn } from 'cn';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow
} from '@/components/atoms';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { RenderIf } from "@koi/ui";

export type AuthFrameProps = {
  eyebrow: ReactNode;
  title: string;
  lede: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function AuthFrame({
  eyebrow,
  title,
  lede,
  children,
  aside,
  className
}: AuthFrameProps) {
  return (
    <>
      <PageTrail trail={[{ label: 'Beranda', href: ROUTES.home }, { label: title }]} />
      <div className={cn(CONTAINER, 'flex justify-center py-10 sm:py-16')}>
        <div className={cn('w-full max-w-md', className)}>
          <Card>
            <CardHeader>
              <Eyebrow>{eyebrow}</Eyebrow>
              <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
              <CardDescription>{lede}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>

          <RenderIf when={aside}>
            {(node) => (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {node}
              </p>
            )}
          </RenderIf>
        </div>
      </div>
    </>
  );
}

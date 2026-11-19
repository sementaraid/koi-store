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
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import { RenderIf } from "@koi/ui";
import type { HeaderAccount, HeaderCart } from '@/types/header';

export type AuthFrameProps = {
  eyebrow: ReactNode;
  title: string;
  lede: string;
  children: ReactNode;
  aside?: ReactNode;
  account?: HeaderAccount;
  cart?: HeaderCart;
  className?: string;
};

export function AuthFrame({
  eyebrow,
  title,
  lede,
  children,
  aside,
  account,
  cart,
  className
}: AuthFrameProps) {
  return (
    <PageShell
      activeHref={undefined}
      account={account}
      cart={cart}
      trail={[{ label: 'Beranda', href: ROUTES.home }, { label: title }]}
    >
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
    </PageShell>
  );
}

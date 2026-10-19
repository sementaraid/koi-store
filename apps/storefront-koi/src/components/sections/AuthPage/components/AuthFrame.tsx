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
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import type { HeaderAccount, HeaderCart } from '@/types/header';

/** Props for {@link AuthFrame}: the page's words, and the session the bar
    wears around it. */
export type AuthFrameProps = {
  /** Small caps label over the title — what this page is, to the house. */
  eyebrow: ReactNode;
  /** The page's `h1`. */
  title: string;
  /** One sentence under the title: why this page, why now. */
  lede: string;
  /** The form itself. */
  children: ReactNode;
  /** The way to the page's twin — "belum punya akun?", "sudah punya?" — set
      under the card so it reads as the next step, not as part of the form. */
  aside?: ReactNode;
  /** Signed-in state, so the bar shows the right face while the visitor is
      filling in a form they may already be past. */
  account?: HeaderAccount;
  cart?: HeaderCart;
  className?: string;
};

/**
 * The frame every auth screen is drawn in: the site's own chrome, and a single
 * card in the middle of it.
 *
 * @remarks
 * All four pages ask the visitor one question and take one answer, so they are
 * one page with four sets of words — not four pages that happen to look alike.
 * The card is deliberately modest: a visitor here is mid-task, and a hero would
 * be a detour on the way back to the lot they were bidding on.
 *
 * The trail always starts at the floor and names the page, so the auth screens
 * do not float outside the site's map just because they are not part of the
 * feed.
 *
 * @example
 * <AuthFrame eyebrow="Masuk" title="Selamat datang kembali" lede="…">
 *   <LoginForm … />
 * </AuthFrame>
 */
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

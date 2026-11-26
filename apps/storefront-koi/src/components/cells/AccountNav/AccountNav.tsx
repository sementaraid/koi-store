'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Gavel,
  House,
  LogOut,
  MapPin,
  Package,
  Settings,
  Sprout,
  Star,
  Wallet
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { ROUTES } from '@/const/routes';
import { useSignOut } from '@/hooks/use-sign-out';

export type AccountNavItem = {
  label: string;
  href: string;
  count?: number;
};

export type AccountNavProps = {
  items: AccountNavItem[];
  footer?: AccountNavItem[];
  className?: string;
  /** Unique per rendered menu, so the sign-out button id stays unique. */
  signOutFormId?: string;
};

const ICONS: Record<string, LucideIcon> = {
  [ROUTES.account]: House,
  [ROUTES.myBids]: Gavel,
  [ROUTES.orders]: Package,
  [ROUTES.saldoTopup]: Wallet,
  [ROUTES.addresses]: MapPin,
  [ROUTES.reviews]: Star,
  [ROUTES.settings]: Settings,
  [ROUTES.farm]: Sprout,
  [ROUTES.farmHome]: Sprout,
  [ROUTES.signout]: LogOut
};

export function AccountNav({
  items,
  footer,
  className,
  signOutFormId = 'akun-nav-keluar'
}: AccountNavProps) {
  const pathname = usePathname();
  const { signOut } = useSignOut();

  return (
    <nav
      aria-label="Menu akun"
      className={className}
    >
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-2">
        {items.map((item) => (
          <Row
            key={item.href}
            item={item}
            pathname={pathname}
            onSignOut={signOut}
            signOutFormId={signOutFormId}
          />
        ))}
      </ul>

      <RenderIf when={footer?.length ? footer : undefined}>
        {(rows) => (
          <>
            {/* US-103 AC10: the divider between the account pages and farm/sign-out. */}
            <div
              role="separator"
              className="mx-3 my-2 h-px bg-divider"
            />
            <ul className="grid grid-cols-3 gap-2 lg:grid-cols-2">
              {rows.map((item) => (
                <Row
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onSignOut={signOut}
                  signOutFormId={signOutFormId}
                />
              ))}
            </ul>
          </>
        )}
      </RenderIf>
    </nav>
  );
}

function Row({
  item,
  pathname,
  onSignOut,
  signOutFormId
}: {
  item: AccountNavItem;
  pathname: string;
  onSignOut: () => void;
  signOutFormId: string;
}) {
  const current =
    item.href === ROUTES.account
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const signout = item.href === ROUTES.signout;
  const Icon = ICONS[item.href];

  const className = cn(
    'flex min-h-20 w-full flex-col items-center justify-center gap-1.5 rounded-control px-2 py-3 text-center text-xs leading-tight transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:ring-offset-0',
    current
      ? 'bg-accent font-semibold text-accent-ink'
      : signout
        ? 'font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive-ink'
        : 'font-medium text-muted-foreground hover:bg-surface hover:text-accent-ink'
  );

  const body = (
    <>
      <span className="relative grid size-6 shrink-0 place-items-center">
        <RenderIf when={Icon}>
          {(Glyph) => (
            <Glyph
              aria-hidden
              className="size-5"
            />
          )}
        </RenderIf>
        <RenderIf when={item.count}>
          {(count) => (
            <span className="absolute -top-2 -right-3 min-w-5 rounded-full bg-destructive/12 px-1.5 py-0.5 text-center text-2xs font-bold text-destructive-ink tabular-nums">
              {count}
            </span>
          )}
        </RenderIf>
      </span>
      <span className="max-w-full break-words">{item.label}</span>
    </>
  );

  if (signout) {
    return (
      <li>
        <button
          id={signOutFormId}
          type="button"
          onClick={onSignOut}
          className={className}
        >
          {body}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        aria-current={current ? 'page' : undefined}
        className={className}
      >
        {body}
      </Link>
    </li>
  );
}

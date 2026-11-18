'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareText,
  MessagesSquare,
  Package,
  Settings,
  Sprout,
  Trophy,
  Wallet
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { RenderIf, buttonVariants } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { ROUTES } from '@/const/routes';

export type AccountNavItem = {
  label: string;
  href: string;
  count?: number;
};

export type AccountNavProps = {
  items: AccountNavItem[];
  footer?: AccountNavItem[];
  className?: string;
};

const SIGN_OUT_FORM_ID = 'akun-nav-keluar';

const ICONS: Record<string, LucideIcon> = {
  [ROUTES.account]: LayoutDashboard,
  [ROUTES.orders]: Package,
  [ROUTES.wonLots]: Trophy,
  [ROUTES.wallet]: Wallet,
  [ROUTES.topup]: Banknote,
  [ROUTES.addresses]: MapPin,
  [ROUTES.reviews]: MessageSquareText,
  [ROUTES.messages]: MessagesSquare,
  [ROUTES.farm]: Sprout,
  [ROUTES.settings]: Settings,
  [ROUTES.signout]: LogOut
};

export function AccountNav({ items, footer, className }: AccountNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu akun"
      className={className}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <Row
            key={item.href}
            item={item}
            pathname={pathname}
          />
        ))}
      </ul>

      <RenderIf when={footer?.length ? footer : undefined}>
        {(rows) => (
          <>
            <ul className="mt-3 flex flex-col gap-1">
              {rows.map((item) => (
                <Row
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </ul>
            <form
              id={SIGN_OUT_FORM_ID}
              method="post"
              action={ROUTES.signout}
            />
          </>
        )}
      </RenderIf>
    </nav>
  );
}

function Row({ item, pathname }: { item: AccountNavItem; pathname: string }) {
  const current =
    item.href === ROUTES.account
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const signout = item.href === ROUTES.signout;
  const Icon = ICONS[item.href];

  const className = cn(
    'flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm whitespace-nowrap transition-colors',
    current
      ? cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'h-auto justify-start rounded-[10px] px-3 py-2.5 text-sm font-bold text-foreground'
        )
      : signout
        ? 'font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive-ink'
        : 'font-medium text-muted-foreground hover:bg-card hover:text-accent-ink'
  );

  const body = (
    <>
      <RenderIf when={Icon}>
        {(Glyph) => (
          <Glyph
            aria-hidden
            className={cn('size-4 shrink-0', current && 'text-accent-ink')}
          />
        )}
      </RenderIf>
      <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
      <RenderIf when={item.count}>
        {(count) => (
          <span className="min-w-5 rounded-full bg-destructive/12 px-1.5 py-0.5 text-center text-2xs font-bold text-destructive-ink tabular-nums">
            {count}
          </span>
        )}
      </RenderIf>
    </>
  );

  if (signout) {
    return (
      <li>
        <button
          type="submit"
          form={SIGN_OUT_FORM_ID}
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

import type { ReactNode } from 'react';
import { cn } from 'cn';

import { AccountNav, type AccountNavItem } from '@/components/cells/AccountNav/AccountNav';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import { RenderIf } from '@koi/ui';
import type { AccountIdentity } from '@/lib/helpers/account-identity';
import { initials } from '@/lib/helpers/header';

export type { AccountIdentity };

export type AccountFrameProps = {
  openOrders?: number;
  title: string;
  identity?: AccountIdentity;
  /** Sits on the title line, e.g. the page's tabs or a page-level button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Extra classes for the content column, e.g. a route's stable min-height. */
  contentClassName?: string;
  /**
   * Show the account menu as a list below the content on mobile. Only the
   * account home (`/akun`) does, so every other account page starts with its
   * own content (US-103 AC4).
   */
  showMenuOnMobile?: boolean;
};

// US-103 AC10: board order and labels.
const NAV_ITEMS: Omit<AccountNavItem, 'count'>[] = [
  { label: 'Ringkasan', href: ROUTES.account },
  { label: 'Bid Saya', href: ROUTES.myBids },
  { label: 'Pesanan katalog', href: ROUTES.orders },
  { label: 'Saldo & top-up', href: ROUTES.saldoTopup },
  { label: 'Alamat', href: ROUTES.addresses },
  { label: 'Ulasan', href: ROUTES.reviews },
  { label: 'Pengaturan', href: ROUTES.settings }
];

export function AccountFrame({
  openOrders,
  title,
  identity,
  action,
  children,
  className,
  contentClassName,
  showMenuOnMobile = false
}: AccountFrameProps) {
  const items: AccountNavItem[] = NAV_ITEMS.map((item) =>
    item.href === ROUTES.orders ? { ...item, count: openOrders } : item
  );

  // US-103 AC10: a registered farmer gets their farm area; everyone else the
  // registration link.
  const footer: AccountNavItem[] = [
    identity?.isFarmer
      ? { label: 'Farm saya', href: ROUTES.farmHome }
      : { label: 'Daftar jadi farm', href: ROUTES.farm },
    { label: 'Keluar', href: ROUTES.signout }
  ];

  const menu = (signOutFormId: string, navClassName?: string) => (
    <AccountNav
      items={items}
      footer={footer}
      signOutFormId={signOutFormId}
      className={navClassName}
    />
  );

  return (
    <div
      className={cn(
        CONTAINER,
        'grid gap-8 py-8 sm:py-10 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10',
        className
      )}
    >
      <aside className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-4">
          <RenderIf when={identity}>
            {(me) => (
              <div className="flex items-center gap-3 px-3 pb-2">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-sm font-extrabold tracking-wider text-accent-ink"
                >
                  {initials(me.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{me.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {me.city ? `Pembeli · ${me.city}` : 'Pembeli'}
                  </p>
                </div>
              </div>
            )}
          </RenderIf>

          {menu('akun-nav-keluar')}
        </div>
      </aside>

      <div className={cn('flex min-w-0 flex-col gap-6', contentClassName)}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-xl leading-8 font-bold text-balance text-foreground sm:text-2xl">
            {title}
          </h1>
          <RenderIf when={action}>
            {(node) => <div className="flex flex-wrap items-center gap-3">{node}</div>}
          </RenderIf>
        </div>

        {children}

        <RenderIf when={showMenuOnMobile}>
          {() => (
            <section
              aria-labelledby="menu-akun-ponsel"
              className="flex flex-col gap-3 lg:hidden"
            >
              <h2
                id="menu-akun-ponsel"
                className="px-3 font-heading text-base font-bold text-foreground"
              >
                Menu akun
              </h2>
              {menu('akun-nav-keluar-ponsel', 'rounded-xl border border-border bg-card p-2')}
            </section>
          )}
        </RenderIf>
      </div>
    </div>
  );
}

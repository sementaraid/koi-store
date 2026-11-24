import type { ReactNode } from 'react';
import { cn } from 'cn';

import { AccountNav, type AccountNavItem } from '@/components/cells/AccountNav/AccountNav';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { RenderIf } from "@koi/ui";
import { initials } from '@/lib/helpers/header';

export type AccountIdentity = {
  name: string;
  email: string;
};

export type AccountFrameProps = {
  openOrders?: number;
  title: string;
  eyebrow?: ReactNode;
  heading?: string;
  description?: ReactNode;
  identity?: AccountIdentity;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Show the account menu as a list below the content on mobile. Only the
   * account home (`/akun`) does, so every other account page starts with its
   * own content (US-103 AC4).
   */
  showMenuOnMobile?: boolean;
};

const NAV_ITEMS: Omit<AccountNavItem, 'count'>[] = [
  { label: 'Beranda akun', href: ROUTES.account },
  { label: 'Pesanan', href: ROUTES.orders },
  { label: 'Bid Saya', href: ROUTES.myBids },
  { label: 'Lot dimenangkan', href: ROUTES.wonLots },
  { label: 'Saldo', href: ROUTES.wallet },
  { label: 'Top-up', href: ROUTES.topup },
  { label: 'Alamat', href: ROUTES.addresses },
  { label: 'Ulasan', href: ROUTES.reviews },
  { label: 'Pesan', href: ROUTES.messages },
  { label: 'Kebun', href: ROUTES.farm }
];

const NAV_FOOTER: AccountNavItem[] = [
  { label: 'Pengaturan', href: ROUTES.settings },
  { label: 'Keluar', href: ROUTES.signout }
];

export function AccountFrame({
  openOrders,
  title,
  eyebrow,
  heading,
  description,
  identity,
  action,
  children,
  className,
  showMenuOnMobile = false
}: AccountFrameProps) {
  const items: AccountNavItem[] = NAV_ITEMS.map((item) =>
    item.href === ROUTES.orders ? { ...item, count: openOrders } : item
  );

  return (
    <>
      <PageTrail
        trail={[
          { label: 'Beranda', href: ROUTES.home },
          { label: 'Akun', href: ROUTES.account },
          { label: title }
        ]}
      />
      <div className={cn(CONTAINER, 'flex flex-wrap items-end justify-between gap-8 py-8')}>
        <div className="max-w-xl">
          <RenderIf when={eyebrow}>{(node) => <Eyebrow>{node}</Eyebrow>}</RenderIf>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-extrabold text-balance sm:text-4xl lg:text-5xl">
            {heading ?? title}
          </h1>
          <RenderIf when={description}>
            {(node) => (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{node}</p>
            )}
          </RenderIf>
        </div>

        <RenderIf when={action}>
          {(node) => <div className="flex flex-wrap items-center gap-4">{node}</div>}
        </RenderIf>
      </div>

      <div className="border-t border-border bg-muted/40">
        <div
          className={cn(
            CONTAINER,
            'grid gap-8 py-8 sm:py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10',
            className
          )}
        >
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <RenderIf when={identity}>
                {(me) => (
                  <div className="flex items-center gap-3 px-3">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-extrabold tracking-wider text-primary-foreground"
                    >
                      {initials(me.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{me.name}</p>
                      <RenderIf when={me.email}>
                        {(email) => (
                          <p className="truncate text-xs text-muted-foreground">{email}</p>
                        )}
                      </RenderIf>
                    </div>
                  </div>
                )}
              </RenderIf>

              <AccountNav
                items={items}
                footer={NAV_FOOTER}
                signOutFormId="akun-nav-keluar"
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-10">
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
                  <AccountNav
                    items={items}
                    footer={NAV_FOOTER}
                    signOutFormId="akun-nav-keluar-ponsel"
                    className="rounded-xl border border-border bg-card p-2"
                  />
                </section>
              )}
            </RenderIf>
          </div>
        </div>
      </div>
    </>
  );
}

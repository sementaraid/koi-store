import type { ReactNode } from 'react';
import { cn } from 'cn';

import { AccountNav, type AccountNavItem } from '@/components/cells/AccountNav/AccountNav';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { initials } from '@/lib/helpers/header';
import type { HeaderAccount, HeaderCart } from '@/types/header';

/** Who the page is for, drawn at the hero's end. */
export type AccountIdentity = {
  name: string;
  email: string;
};

/** Props for {@link AccountFrame}. */
export type AccountFrameProps = {
  /** How many of the customer's orders are still open — drawn as the count
      beside Pesanan. Omitted, the row carries none. */
  openOrders?: number;
  /** The breadcrumb's last crumb — the page's own name. Also the hero's
      heading, unless `heading` says otherwise. */
  title: string;
  /** The small caps label above the heading — the page's class of thing
      ("Transaksi", "Akun"), glyph and all. */
  eyebrow?: ReactNode;
  /** The hero's heading, when it is not the crumb: `Selamat datang Herlina`
      under the crumb `Beranda akun`. @defaultValue `title` */
  heading?: string;
  /** The line under the heading — what the page is for. */
  description?: ReactNode;
  /** The signed-in customer, named and addressed at the hero's end. */
  identity?: AccountIdentity;
  /** The page's own control in the hero — "Tambah alamat", "Semua pesanan". */
  action?: ReactNode;
  /** The page's body. */
  children: ReactNode;
  account?: HeaderAccount;
  cart?: HeaderCart;
  className?: string;
};

/** The sidebar's own pages, above the rule. Rows carry no glyph here: this is a
    server component, and `AccountNav` is a client one, so each row's icon is
    looked up there by href rather than handed across the boundary. */
const NAV_ITEMS: Omit<AccountNavItem, 'count'>[] = [
  { label: 'Beranda akun', href: ROUTES.account },
  { label: 'Pesanan', href: ROUTES.orders },
  { label: 'Alamat', href: ROUTES.addresses }
];

/** Below the rule: how the account is kept, and the way out. */
const NAV_FOOTER: AccountNavItem[] = [
  { label: 'Pengaturan', href: ROUTES.settings },
  { label: 'Keluar', href: ROUTES.signout }
];

/**
 * The chrome every account page shares: the site bar, a trail back to the
 * floor, the page's own hero, and the sidebar-plus-column layout below it.
 *
 * @remarks
 * One component because five pages drawing their own two-column grid is how
 * two of them end up a gutter apart — the same reason `AuthFrame` and
 * `PageShell` exist. The sidebar is capped at `max-w-[320px]` and the content
 * column grows to fill the rest, which is the mockup's `flex: 1 1 280px` /
 * `flex: 999 1 560px` pair read in Tailwind's own units.
 *
 * The hero is the frame's too, not each page's: the mockup sets it on the page
 * background *above* the sidebar, with the body below it on a tinted panel
 * behind a hairline — a page drawing its own heading inside the content column
 * is a page whose title starts at the sidebar's second row instead. Five pages
 * hand it an eyebrow, a heading and a line, and the frame draws all five the
 * same size.
 */
export function AccountFrame({
  openOrders,
  title,
  eyebrow,
  heading,
  description,
  identity,
  action,
  children,
  account,
  cart,
  className
}: AccountFrameProps) {
  const items: AccountNavItem[] = NAV_ITEMS.map((item) =>
    item.href === ROUTES.orders ? { ...item, count: openOrders } : item
  );

  return (
    <PageShell
      account={account}
      cart={cart}
      trail={[
        { label: 'Beranda', href: ROUTES.home },
        { label: 'Akun', href: ROUTES.account },
        { label: title }
      ]}
    >
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

        <div className="flex flex-wrap items-center gap-4">
          <RenderIf when={identity}>
            {(who) => (
              <div className="flex items-center gap-3">
                {/* A monogram, not the kit's `Avatar`: the hero has no image to
                    show — the customer uploads none — and the primitive's whole
                    job is the image-with-fallback swap. */}
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-extrabold tracking-wider text-primary-foreground"
                >
                  {initials(who.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{who.name}</p>
                  <p className="text-xs break-all text-muted-foreground">{who.email}</p>
                </div>
              </div>
            )}
          </RenderIf>
          <RenderIf when={action}>{(node) => node}</RenderIf>
        </div>
      </div>

      {/* The body stands on the tinted panel behind a hairline, which is what
          separates the page's work from its title. */}
      <div className="border-t border-border bg-muted/40">
        <div
          className={cn(
            CONTAINER,
            'flex flex-wrap items-start gap-10 py-8 sm:py-10',
            className
          )}
        >
          <AccountNav
            items={items}
            footer={NAV_FOOTER}
            /* Sticky from `lg` only: the sidebar sits above the content on a
               phone, where pinning it would eat the fold. */
            className="min-w-[260px] flex-[1_1_280px] sm:max-w-[320px] lg:sticky lg:top-24"
          />

          {/* The sidebar reads the current page off the router itself, so nothing
              here has to be told which page it is. */}
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}

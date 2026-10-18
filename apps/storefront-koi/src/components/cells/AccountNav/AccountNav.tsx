'use client';

import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, LogOut, MapPin, Package, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { buttonVariants } from '@/components/atoms/Button/Button';
import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { ROUTES } from '@/const/routes';

/** One row of the account sidebar. */
export type AccountNavItem = {
  label: string;
  href: string;
  /** A tally drawn at the row's end — how many orders are waiting, say. `0`
      and `undefined` both draw nothing: a count of zero is a row that looks
      answered when it has nothing to answer. */
  count?: number;
};

/** Props for {@link AccountNav}. */
export type AccountNavProps = {
  /** The pages above the rule — what the customer came here to do. */
  items: AccountNavItem[];
  /** The pages below it: how the account itself is kept, and the way out. */
  footer?: AccountNavItem[];
  className?: string;
};

/** The sign-out form's id. Same rule as the header's menu: sign-out is a state
    change, so it posts — see `app/(auth)/keluar/route.ts`. */
const SIGN_OUT_FORM_ID = 'akun-nav-keluar';

/** Each destination's glyph, matching the header's account dropdown
    (`DEFAULT_ACCOUNT_LINKS`) so the same page wears the same mark wherever the
    customer meets it.

    Looked up here rather than passed in: a `LucideIcon` is a function, and a
    server component cannot hand a function to a client one — the rows arrive as
    plain `{ label, href, count }` and pick up their glyph on this side. */
const ICONS: Record<string, LucideIcon> = {
  [ROUTES.account]: LayoutDashboard,
  [ROUTES.orders]: Package,
  [ROUTES.addresses]: MapPin,
  [ROUTES.settings]: Settings,
  [ROUTES.signout]: LogOut
};

/**
 * The account's own sidebar: every page of the dashboard, with the current one
 * stated rather than merely tinted.
 *
 * @remarks
 * A bare column on the panel the page stands on, not a card of its own: the
 * page body's tint is already the surface here, and one raised panel wrapped
 * around another raised row reads as a box drawn inside a box. Instead the
 * *current* row is the raised surface — a white card that lifts off the tint —
 * which is what makes the position legible without a second frame.
 *
 * The current row carries `aria-current="page"` as well as its fill, so the
 * position is announced and not only seen — a sidebar whose only signal is
 * bolder ink tells a screen-reader user nothing at all.
 *
 * Keluar is a submit button, not a link, for the same reason it is in the
 * header's dropdown: a GET sign-out is one a prefetch or a crawler can follow,
 * which signs the visitor out for hovering. It is drawn in the danger tone
 * only on approach — a permanently red row in a sidebar reads as an error the
 * page is already in.
 *
 * @example
 * <AccountNav
 *   items={[{ label: 'Beranda akun', href: ROUTES.account, icon: LayoutDashboard }]}
 *   footer={[{ label: 'Pengaturan', href: ROUTES.settings, icon: Settings }]}
 * />
 */
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
            {/* Outside the list, drawn once: the row above submits it by id. */}
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

/** The shared row shape: a white card for the page being read — lifted off the
    panel, the mockup's standing pill — quiet ink for every other until the
    pointer reaches it. */
function Row({ item, pathname }: { item: AccountNavItem; pathname: string }) {
  /* `/akun` must not light up on `/akun/pesanan`, but `/akun/pesanan` must stay
     lit on `/akun/pesanan/order_01`: an exact match for the home row, a prefix
     for the rest. */
  const current =
    item.href === ROUTES.account
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const signout = item.href === ROUTES.signout;
  const Icon = ICONS[item.href];

  /* The current row wears the kit's outline material — gloss, hairline,
     standoff — so the page being read is the one raised control in the column,
     drawn from the same kit as the buttons in the body. The variant's own
     centring, barrel radius and height are overridden back to a 10px,
     start-aligned block; every other row stays a quiet, bare target. */
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
          /* The tally wears the live tone, because the only count this sidebar
             carries is money the house is still waiting for. */
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

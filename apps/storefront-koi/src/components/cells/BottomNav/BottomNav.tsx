'use client';

import { usePathname } from 'next/navigation';
import { Gavel, HandCoins, House, LayoutGrid, UserRound } from 'lucide-react';
import { cn } from 'cn';

import { Link } from '@/components/atoms/Link/Link';
import { ROUTES, signInHref } from '@/const/routes';
import { activeNavHref } from '@/lib/helpers/nav-active';

const ITEMS = [
  { label: 'Beranda', href: ROUTES.home, icon: House },
  { label: 'Lelang', href: ROUTES.auctions, icon: Gavel },
  { label: 'Katalog', href: ROUTES.catalogs, icon: LayoutGrid },
  { label: 'Bid Saya', href: ROUTES.myBids, icon: HandCoins, signedInOnly: true },
  { label: 'Akun', href: ROUTES.account, icon: UserRound, signedInOnly: true }
];

/**
 * The mobile tab bar (US-103 AC2). A guest tapping a signed-in-only tab lands on
 * sign-in and comes back to that tab. The active tab carries a bar above the
 * icon as well as weight, so the state never rests on colour.
 */
export function BottomNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const active = activeNavHref(
    pathname,
    ITEMS.map((item) => item.href)
  );

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-divider bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-16 w-full max-w-[1200px] items-stretch">
        {ITEMS.map(({ label, href, icon: Icon, signedInOnly }) => {
          const current = href === active;
          const target = signedInOnly && !signedIn ? signInHref(href) : href;

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={target}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 text-2xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  current
                    ? 'font-bold text-accent-ink'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent-ink transition-opacity',
                    current ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Icon aria-hidden className="size-6" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

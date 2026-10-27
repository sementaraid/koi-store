'use client';

import { Home } from '@/components/sections/HomePage/components/Home';
import type { HeaderAccount } from '@/types/header';
import type { HomeProps } from '@/types/home';

/**
 * The front page's client boundary.
 *
 * The lot strip draws live countdowns (`useCountdown`), so the page cannot be a
 * server component — the same reason every feed route here has an island. There
 * is no URL state to own, unlike the feeds, so the island is this thin.
 */
export function Landing({
  account,
  partners
}: {
  account?: HeaderAccount;
} & Pick<HomeProps, 'partners'>) {
  return <Home account={account} {...(partners ? { partners } : {})} />;
}

'use client';

import { Home } from '@/components/pages/homepage';
import type { HeaderAccount } from '@/components/types/header';

/**
 * The front page's client boundary.
 *
 * The lot strip draws live countdowns (`useCountdown`), so the page cannot be a
 * server component — the same reason every feed route here has an island. There
 * is no URL state to own, unlike the feeds, so the island is this thin.
 */
export function Landing({ account }: { account?: HeaderAccount }) {
  return <Home account={account} />;
}

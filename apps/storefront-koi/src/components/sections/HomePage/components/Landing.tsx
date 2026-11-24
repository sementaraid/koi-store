'use client';

import { Home } from '@/components/sections/HomePage/components/Home';
import type { HeaderAccount } from '@/types/header';
import type { HomeProps } from '@/types/home';

export function Landing({
  account,
  featured,
  lots,
  lotsFailed,
  partners,
  now
}: {
  account?: HeaderAccount;
} & Pick<HomeProps, 'featured' | 'lots' | 'lotsFailed' | 'partners' | 'now'>) {
  return (
    <Home
      account={account}
      now={now}
      {...(featured ? { featured } : {})}
      {...(lots ? { lots } : {})}
      {...(lotsFailed ? { lotsFailed } : {})}
      {...(partners ? { partners } : {})}
    />
  );
}

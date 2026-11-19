'use client';

import { Home } from '@/components/sections/HomePage/components/Home';
import type { HeaderAccount } from '@/types/header';
import type { HomeProps } from '@/types/home';

export function Landing({
  account,
  featured,
  lots,
  partners
}: {
  account?: HeaderAccount;
} & Pick<HomeProps, 'featured' | 'lots' | 'partners'>) {
  return (
    <Home
      account={account}
      {...(featured ? { featured } : {})}
      {...(lots ? { lots } : {})}
      {...(partners ? { partners } : {})}
    />
  );
}

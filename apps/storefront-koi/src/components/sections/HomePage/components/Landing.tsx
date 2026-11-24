'use client';

import { Home } from '@/components/sections/HomePage/components/Home';
import type { HomeProps } from '@/types/home';

export function Landing({
  featured,
  lots,
  lotsFailed,
  partners,
  now
}: Pick<HomeProps, 'featured' | 'lots' | 'lotsFailed' | 'partners' | 'now'>) {
  return (
    <Home
      now={now}
      {...(featured ? { featured } : {})}
      {...(lots ? { lots } : {})}
      {...(lotsFailed ? { lotsFailed } : {})}
      {...(partners ? { partners } : {})}
    />
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LivePage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Lelang Live',
  description: 'Ruang siar lelang: lot yang sedang di atas panggung, sekarang.'
};

export default async function LiveRoute({
  searchParams
}: {
  searchParams: Promise<{ lot?: string }>;
}) {
  const { lot } = await searchParams;

  return (
    <Suspense>
      <LivePage featuredId={lot} />
    </Suspense>
  );
}

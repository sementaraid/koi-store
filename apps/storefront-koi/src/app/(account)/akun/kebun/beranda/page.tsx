import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FarmHomePage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Area petani'
};

export default function Page({
  searchParams
}: {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense>
      <FarmHomePage searchParams={searchParams} />
    </Suspense>
  );
}

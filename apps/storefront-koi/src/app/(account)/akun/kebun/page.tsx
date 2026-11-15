import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FarmPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Kebun saya'
};

export default function Page() {
  return (
    <Suspense>
      <FarmPage />
    </Suspense>
  );
}

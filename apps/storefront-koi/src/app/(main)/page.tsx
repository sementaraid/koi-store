import { Suspense } from 'react';

import { HomePage } from '@/components/sections';

export default function HomeRoute() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}

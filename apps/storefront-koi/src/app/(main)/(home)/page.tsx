import { Suspense } from 'react';
import { HomePage } from '@/components/sections';
import { HomeSkeleton } from '@/components/sections/LoadingPages/LoadingPages';

export default function HomeRoute() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomePage />
    </Suspense>
  );
}

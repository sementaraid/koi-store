import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';

import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { RetryButton } from '@/components/cells/RetryButton/RetryButton';
import { CONTAINER } from '@/const/layout';
import { getLot } from '@/lib/data/lots';

import LotLoading from './loading';

// Runs above this route's loading.tsx, like the product and partner layouts.
// Next commits the status code when the shell is sent, so the missing-lot check
// must happen here; notFound() from inside the page arrives too late (200).
// Keep the check outside the Suspense boundary, or a missing lot would stream
// the skeleton and settle on 200 again.
//
// A read failure is caught here, not thrown: this layout sits above the
// segment's error.tsx, so a throw would skip it and land on the app-wide error
// page. getLot already turns a 404 into null; everything else is a backend or
// network failure (US-100 AC4).
export default async function LotLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let lot;
  try {
    lot = await getLot(id);
  } catch {
    return (
      <div role="alert" className={`${CONTAINER} py-16`}>
        <EmptyFeed
          icon={<TriangleAlert aria-hidden />}
          narrowing={false}
          noMatchTitle="Lot tidak dapat dimuat"
          noMatchBody="Data lot sedang tidak tersedia. Coba lagi sebentar lagi."
          action={<RetryButton />}
        />
      </div>
    );
  }

  if (!lot) notFound();

  return <Suspense fallback={<LotLoading />}>{children}</Suspense>;
}

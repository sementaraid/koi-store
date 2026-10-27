import type { Metadata } from 'next';

import { PartnerPage, getPartner } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const seller = await getPartner(handle);

  if (!seller) return { title: 'Mitra tidak ditemukan' };

  return {
    title: seller.name,
    description: seller.description ?? undefined,
    openGraph: seller.logo ? { images: [{ url: seller.logo }] } : undefined
  };
}

/* No `Suspense`, same reasoning as `produk/[handle]`: an unknown handle is a
   `notFound()` inside the section, and a boundary above it would flush the
   shell before the 404 could be set. */
export default async function PartnerRoute({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { handle } = await params;
  const { page } = await searchParams;

  return <PartnerPage handle={handle} page={page ? Number(page) : 1} />;
}

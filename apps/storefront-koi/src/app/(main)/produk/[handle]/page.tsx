import type { Metadata } from 'next';

import { ProductDetailsPage, getProduct } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) return { title: 'Produk tidak ditemukan' };

  return {
    title: product.title,
    description: product.description ?? undefined,
    openGraph: product.thumbnail
      ? { images: [{ url: product.thumbnail }] }
      : undefined
  };
}

/* No `Suspense`: an unknown handle is a `notFound()` inside the section, and a
   boundary above it would flush the shell before the 404 could be set. Same
   reason the delivery route awaits its section. */
export default async function ProductRoute({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return <ProductDetailsPage handle={handle} />;
}

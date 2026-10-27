import type { Metadata } from 'next';

import { INFO_SLUGS } from '@/const/info';
import { InfoPage, getInfoDoc } from '@/components/sections';

/* The twelve standing pages are known at build time and never change between
   deploys, so they are generated rather than rendered per request. `false`
   closes the catch-all: a segment that is not one of them is a 404 from the
   router, before the section runs — which is what keeps this route from
   shadowing a typo of `/katalog` with a standing page. */
export const dynamicParams = false;

export function generateStaticParams() {
  return INFO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getInfoDoc(slug);

  if (!doc) return { title: 'Halaman tidak ditemukan' };

  return { title: doc.title, description: doc.lede };
}

/* No `Suspense`: an unknown segment is a `notFound()` inside the section, and a
   boundary above it would flush the shell before the 404 could be set — the
   same reason `produk/[handle]` and `mitra/[handle]` await theirs. */
export default async function InfoRoute({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <InfoPage slug={slug} />;
}

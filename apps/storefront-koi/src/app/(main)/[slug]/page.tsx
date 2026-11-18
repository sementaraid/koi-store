import type { Metadata } from 'next';

import { INFO_SLUGS } from '@/const/info';
import { InfoPage, getInfoDoc } from '@/components/sections';

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

export default async function InfoRoute({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <InfoPage slug={slug} />;
}

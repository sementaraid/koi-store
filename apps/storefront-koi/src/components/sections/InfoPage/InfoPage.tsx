import { notFound } from 'next/navigation';

import { INFO_DOCS } from '@/const/info';

import { Info } from './components/Info';

export function getInfoDoc(slug: string) {
  return INFO_DOCS[slug] ?? null;
}

export function InfoPage({ slug }: { slug: string }) {
  const doc = getInfoDoc(slug);

  if (!doc) notFound();

  return <Info doc={doc} slug={slug} />;
}

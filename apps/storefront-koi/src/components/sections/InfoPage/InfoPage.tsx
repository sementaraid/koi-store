import { notFound } from 'next/navigation';

import { INFO_DOCS } from '@/const/info';
import { getShell } from '@/lib/shell';

import { Info } from './components/Info';

export function getInfoDoc(slug: string) {
  return INFO_DOCS[slug] ?? null;
}

export async function InfoPage({ slug }: { slug: string }) {
  const [{ account, cart }, doc] = await Promise.all([
    getShell(),
    Promise.resolve(getInfoDoc(slug))
  ]);

  if (!doc) notFound();

  return <Info doc={doc} slug={slug} account={account} cart={cart} />;
}

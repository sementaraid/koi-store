import { notFound } from 'next/navigation';

import { INFO_DOCS } from '@/const/info';
import { getShell } from '@/lib/shell';

import { Info } from './components/Info';

/** One standing page's copy, or nothing. Shared with `generateMetadata`, the
    same way `getProduct` and `getPartner` are. */
export function getInfoDoc(slug: string) {
  return INFO_DOCS[slug] ?? null;
}

/**
 * The house's standing pages: the bidding guide, the escrow rules, the
 * quarantine standard, the legal row.
 *
 * @remarks
 * No `Promise.all` over a doc fetch, unlike every other section here — the copy
 * is a constant, so the only thing to await is the shell. It still goes through
 * a section rather than straight into the route because the shell's account and
 * cart are read server-side, and `app/` holds no data calls anywhere in this
 * storefront.
 */
export async function InfoPage({ slug }: { slug: string }) {
  const [{ account, cart }, doc] = await Promise.all([
    getShell(),
    Promise.resolve(getInfoDoc(slug))
  ]);

  /* An unknown segment is a 404, not an empty frame: this route is a catch-all
     under `/`, so without this every typo on the site would render a blank
     standing page with a 200. */
  if (!doc) notFound();

  return <Info doc={doc} slug={slug} account={account} cart={cart} />;
}

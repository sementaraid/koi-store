import type { MetadataRoute } from 'next';

/**
 * What crawlers may read.
 *
 * @remarks
 * The account and the checkout are disallowed rather than merely uninteresting:
 * they are per-customer pages behind a session, so a crawler following a link
 * into them gets a redirect to sign-in and nothing worth indexing. `/keluar` is
 * a POST route.
 *
 * No `sitemap` key: `apps/storefront` advertises one at `/sitemap.xml` that
 * nothing on that app generates either — that bug is not copied here. Add the
 * line back once a real `sitemap.ts` exists to answer it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/akun', '/keranjang', '/pengiriman', '/keluar', '/api/']
      }
    ]
  };
}

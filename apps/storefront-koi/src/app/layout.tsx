import type { Metadata } from 'next';

import './globals.css';

import { Toaster } from 'sonner';

import { retrieveCart } from '@/lib/data/cart';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Indokoi'}`,
    default: process.env.NEXT_PUBLIC_SITE_NAME || 'Indokoi — Lelang & Katalog Koi'
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Lelang koi, katalog nishikigoi, dan perlengkapan kolam dari breeder terverifikasi.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001')
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const cart = await retrieveCart();

  /* One locale, stated here rather than resolved per request: the storefront is
     Indonesian only, so there is no `[locale]` segment to read it from. */
  return (
    <html lang="id">
      <body className="antialiased">
        <Providers cart={cart}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

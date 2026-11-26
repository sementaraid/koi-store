import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';

import './globals.css';

import { Toaster } from 'sonner';

import { retrieveCart } from '@/lib/data/cart';

import { SITE_NAME } from '@/const/site';

import { Providers } from './providers';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_NAME
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

  return (
    <html
      lang="id"
      className={instrumentSans.variable}
    >
      <body className="antialiased">
        <Providers cart={cart}>
          {children}
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

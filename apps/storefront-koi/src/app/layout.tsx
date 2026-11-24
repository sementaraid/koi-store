import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';

import './globals.css';

import { Toaster } from 'sonner';

import { retrieveCart } from '@/lib/data/cart';
import { getSession } from '@/lib/data/session';

import { Providers } from './providers';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap'
});

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
  const [cart, session] = await Promise.all([
    retrieveCart(),
    getSession().catch(() => ({ status: 'error' as const }))
  ]);
  const customer = session.status === 'authenticated' ? session.customer : null;

  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const chat =
    appId && customer?.id && customer.email
      ? {
          appId,
          userId: customer.id,
          userName:
            [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
            customer.email,
          userEmail: customer.email
        }
      : undefined;

  return (
    <html
      lang="id"
      className={instrumentSans.variable}
    >
      <body className="antialiased">
        <Providers
          cart={cart}
          chat={chat}
        >
          {children}
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

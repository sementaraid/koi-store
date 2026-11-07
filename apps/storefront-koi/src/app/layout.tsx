import type { Metadata } from 'next';

import './globals.css';

import { Toaster } from 'sonner';

import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';

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
  const [cart, customer] = await Promise.all([retrieveCart(), retrieveCustomer()]);

  /* The session is handed down rather than read by each chat surface: TalkJS's
     `Session` must be mounted once, above everything that reads it, and a page
     cannot mount one for a child it does not wrap. Omitted when the app id is
     unset or nobody is signed in — every chat control then draws nothing. */
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

  /* One locale, stated here rather than resolved per request: the storefront is
     Indonesian only, so there is no `[locale]` segment to read it from. */
  return (
    <html lang="id">
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

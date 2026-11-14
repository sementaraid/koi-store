import type { Metadata } from 'next';

import './globals.css';

import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    template: '%s | Koi Store Admin',
    default: 'Koi Store Admin'
  },
  /* A back office has nothing to say to a search engine, and `next.config.ts`
     sends `X-Robots-Tag: noindex` besides. */
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /* One locale, stated here: the operators are the same house as the
     storefront's Indonesian. */
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

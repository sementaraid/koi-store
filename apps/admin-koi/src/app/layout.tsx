import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

import { SITE_NAME } from '@/const/site';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE_NAME} Admin`,
    default: `${SITE_NAME} Admin`
  },
  robots: { 
    index: false, 
    follow: false 
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={instrumentSans.variable}
    >
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

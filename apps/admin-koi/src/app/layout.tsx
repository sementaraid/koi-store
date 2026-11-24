import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Koi Store Admin',
    default: 'Koi Store Admin'
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

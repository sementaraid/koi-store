import type { Metadata } from 'next';

/* The group exists for this one line: a sign-in box and a password form are not
   search results, and a reset link that reached an index is a reset link that
   reached whoever reads the index.

   No chrome here — each page draws `PageShell` through `AuthFrame`, as every
   other page in this storefront does, because the shell takes session props a
   layout cannot hand down. */
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function AuthLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

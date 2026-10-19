import type { Metadata } from 'next';

/* The group exists for this one line, the same way `(auth)` does: an account
   page is one person's orders, addresses and name, and a crawler that reached
   one reached a page it had no business holding. Signed-out visitors are
   redirected before anything renders, but a `noindex` costs nothing and does
   not depend on that redirect being right.

   No chrome here — each page draws `PageShell` through `AccountFrame`, which
   takes session props a layout cannot hand down. */
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function AccountLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

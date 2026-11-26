import type { Metadata } from 'next';

import { AppShell } from '@/components/organisms/AppShell/AppShell';
import { getShell } from '@/lib/shell';

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function AccountLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await getShell();

  return (
    <AppShell account={account}>{children}</AppShell>
  );
}

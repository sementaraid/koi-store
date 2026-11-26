import type { Metadata } from 'next';

import { AppShell } from '@/components/organisms/AppShell/AppShell';
import { NotFoundPage } from '@/components/sections/NotFoundPage/NotFoundPage';
import { getShell } from '@/lib/shell';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  description: 'Alamat yang Anda buka tidak ada di portal ini.'
};

// Reached only for a URL no route group matches. A missing record inside a group
// uses that group's own `not-found.tsx`, under the group's shell.
export default async function NotFound() {
  const { account } = await getShell().catch(() => ({
    account: undefined
  }));

  return (
    <AppShell
      account={account}
      markActive={false}
    >
      <NotFoundPage />
    </AppShell>
  );
}

import { AppShell } from '@/components/organisms/AppShell/AppShell';
import { getShell } from '@/lib/shell';

export default async function MainLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await getShell();

  return (
    <AppShell account={account}>{children}</AppShell>
  );
}

import { AppShell } from '@/components/organisms/AppShell/AppShell';
import { getShell } from '@/lib/shell';

export default async function MainLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { account, cart } = await getShell();

  return (
    <AppShell
      account={account}
      cart={cart}
    >
      {children}
    </AppShell>
  );
}

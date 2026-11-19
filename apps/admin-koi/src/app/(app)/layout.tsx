import { Chrome } from '@/components/Chrome';
import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin(ROUTES.home);

  return <Chrome admin={admin}>{children}</Chrome>;
}

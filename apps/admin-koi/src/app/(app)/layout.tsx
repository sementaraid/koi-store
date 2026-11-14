import { Chrome } from '@/components/Chrome';
import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

/**
 * The private half of the app.
 *
 * Every screen under `(app)` is behind this one guard rather than each page
 * calling it: a back office has no public pages, and "the page I forgot to
 * guard" is the only way that goes wrong. A page that needs the operator's own
 * record calls `requireAdmin` again — it is a cheap `/admin/users/me` and the
 * token is already in hand.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin(ROUTES.home);

  return <Chrome admin={admin}>{children}</Chrome>;
}

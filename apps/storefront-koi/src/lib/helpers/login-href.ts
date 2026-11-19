import { ROUTES } from '@/const/routes';
import type { SessionRefusal } from '@/lib/data/session';

/** The sign-in URL for a refusal, naming the honest reason the session ended. */
export function loginHrefFor(session: SessionRefusal, from: string): string {
  const reason =
    session.status === 'expired'
      ? 'sessionExpired'
      : session.status === 'error'
        ? 'sessionError'
        : 'sessionRequired';

  return `${ROUTES.login}?${reason}=true&redirect=${encodeURIComponent(from)}`;
}

import { redirect } from 'next/navigation';
import type { HttpTypes } from '@medusajs/types';

import { loginHrefFor } from '@/lib/helpers/login-href';

import { getSession } from './data/session';

/**
 * Stops a page that needs a signed-in customer. The reason is passed through so
 * the sign-in page can say "session ended" instead of "sign in first", and a
 * backend outage is never reported as a session that ended.
 */
export async function requireCustomer(from: string): Promise<HttpTypes.StoreCustomer> {
  const session = await getSession();

  if (session.status === 'authenticated') return session.customer;

  redirect(loginHrefFor(session, from));
}

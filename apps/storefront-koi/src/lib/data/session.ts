'use server';

import type { HttpTypes } from '@medusajs/types';

import { isTokenExpired } from '@/lib/helpers/token';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

/**
 * The one answer to "is anyone signed in?". Everything that renders identity
 * reads this, so the header, the account pages and the guards cannot disagree.
 *
 * - `anonymous` — no token.
 * - `expired` — a token that is unreadable or past `exp`. The API was not asked:
 *   an expired token is never sent.
 * - `authenticated` — the API accepted the token and returned the customer.
 * - `error` — the API could not answer. Never reported as signed in or expired.
 */
export type Session =
  | { status: 'anonymous' }
  | { status: 'expired' }
  | { status: 'error' }
  | { status: 'authenticated'; customer: HttpTypes.StoreCustomer };

export type SessionRefusal = Extract<Session, { status: 'anonymous' | 'expired' | 'error' }>;

export async function getSession(): Promise<Session> {
  const headers = await getAuthHeaders();

  if (!('authorization' in headers)) return { status: 'anonymous' };

  if (isTokenExpired(headers.authorization.slice('Bearer '.length))) {
    return { status: 'expired' };
  }

  try {
    const { customer } = await (sdk.store.customers.me.query({
      fields: '*orders,*addresses',
      fetchOptions: { headers, cache: 'no-store' }
    } as never) as unknown as Promise<{ customer: HttpTypes.StoreCustomer }>);

    return customer ? { status: 'authenticated', customer } : { status: 'expired' };
  } catch (error) {
    const status = (error as { status?: number } | null)?.status;
    return status === 401 ? { status: 'expired' } : { status: 'error' };
  }
}

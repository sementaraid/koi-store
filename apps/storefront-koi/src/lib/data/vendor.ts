import { ClientError } from '@mercurjs/client';

import { getMemberAuthHeaders } from './cookies';
import { getMyFarm } from './farm';

/** The member token plus `x-seller-id`, for `/vendor/*` calls (D-003).
 *
 * @remarks
 * Deliberately **not** a `'use server'` module: a server action's return value
 * reaches the client, and this returns the bearer token. Only server-side data
 * modules import it.
 *
 * Throws when there is no member session or no farm; every caller sits inside
 * the Farmer area, which already required both. */
export async function vendorHeaders(): Promise<{
  authorization: string;
  'x-seller-id': string;
}> {
  const [headers, seller] = await Promise.all([getMemberAuthHeaders(), getMyFarm()]);
  if (!('authorization' in headers) || !seller) {
    throw new ClientError('Sesi petani tidak aktif.', 'Unauthorized', 401);
  }
  return { ...headers, 'x-seller-id': seller.id };
}

import { ClientError } from '@mercurjs/client';

import { getMemberAuthHeaders } from './cookies';
import { getMyFarm } from './farm';

export async function vendorHeaders(): Promise<{
  authorization: string;
  'x-seller-id': string;
}> {
  const [headers, seller] = await Promise.all([getMemberAuthHeaders(), getMyFarm()]);
  if (!('authorization' in headers) || !seller) {
    throw new ClientError('Sesi peternak tidak aktif.', 'Unauthorized', 401);
  }
  return { ...headers, 'x-seller-id': seller.id };
}

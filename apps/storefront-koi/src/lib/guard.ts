import { redirect } from 'next/navigation';
import type { HttpTypes } from '@medusajs/types';

import { ROUTES } from '@/const/routes';
import { retrieveCustomer } from '@/lib/data/customer';

export async function requireCustomer(from: string): Promise<HttpTypes.StoreCustomer> {
  const customer = await retrieveCustomer();

  if (!customer) {
    redirect(`${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(from)}`);
  }

  return customer;
}

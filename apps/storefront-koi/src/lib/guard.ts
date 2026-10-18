import { redirect } from 'next/navigation';
import type { HttpTypes } from '@medusajs/types';

import { ROUTES } from '@/const/routes';
import { retrieveCustomer } from '@/lib/data/customer';

/**
 * The customer behind an account page, or the door back to sign-in.
 *
 * @param from - The path being guarded, so the sign-in form can return the
 * visitor to it. Pass the page's own route — `safeRedirect` on the other side
 * rejects anything that is not a path of this site's own.
 *
 * @remarks
 * `apps/storefront` is of two minds about this: some pages `redirect("/login")`
 * and lose where the visitor was going, others render `<LoginForm />` in place
 * under the account's own breadcrumb, which says "you are on your addresses
 * page" to someone who is not signed in. This storefront does one thing: send
 * them to the one sign-in page, say why (`sessionRequired`), and bring them
 * back (`redirect`) — `LoginForm` already reads both params.
 *
 * `redirect()` throws, so the return type is the customer with no `null` in it
 * and callers need no second check.
 */
export async function requireCustomer(from: string): Promise<HttpTypes.StoreCustomer> {
  const customer = await retrieveCustomer();

  if (!customer) {
    redirect(`${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(from)}`);
  }

  return customer;
}

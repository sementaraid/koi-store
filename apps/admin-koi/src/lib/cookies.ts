import 'server-only';
import { cookies as nextCookies } from 'next/headers';

/* The admin session, kept the way the storefront keeps the customer's: in an
   httpOnly cookie that no script on the page can read, and never in
   localStorage. A back office token is worth more than a shopper's — it
   approves top-ups and adjusts balances — so the same care is the minimum.

   The name differs from the storefront's `_medusa_jwt` on purpose: the two apps
   run on sibling subdomains of one site, and a shared cookie name is how an
   admin's token ends up sent to the storefront (or overwritten by it). */
const TOKEN = '_koi_admin_jwt';

export const getAuthHeaders = async (): Promise<{ authorization: string } | {}> => {
  const cookies = await nextCookies();
  const token = cookies.get(TOKEN)?.value;

  if (!token) return {};

  return { authorization: `Bearer ${token}` };
};

/** True when a token is present. Says nothing about whether it still works —
    `retrieveAdmin()` is what asks the server that. */
export const hasAuthToken = async () => {
  const headers = await getAuthHeaders();
  return 'authorization' in headers;
};

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies();
  cookies.set(TOKEN, token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
};

export const removeAuthToken = async () => {
  const cookies = await nextCookies();
  cookies.set(TOKEN, '', { maxAge: -1 });
};

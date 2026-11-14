'use server';

import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders, removeAuthToken, setAuthToken } from '../cookies';
import { actorIdOf } from '../helpers/actor-id';

/** The signed-in operator, as the back office needs to name them. */
export type Admin = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

/**
 * The operator behind the current request, or `null`.
 *
 * @remarks
 * Asks the server rather than trusting the cookie: a token can be expired,
 * revoked, or belong to a user whose account was deleted, and all three look
 * identical from here. No caching — a back office is low-traffic and a stale
 * "still signed in" is the one answer that must not be served.
 */
export const retrieveAdmin = async (): Promise<Admin | null> => {
  const authHeaders = await getAuthHeaders();

  /* `getAuthHeaders()` returns `{}` with no token, and `{}` is truthy — so the
     key is what gets checked, not the object. Same trap the storefront's
     `retrieveCustomer` documents. */
  if (!('authorization' in authHeaders)) return null;

  return await (sdk.admin.users.me
    .query({
      fetchOptions: { headers: authHeaders, cache: 'no-store' }
    } as never) as unknown as Promise<{ user: Admin }>)
    .then(({ user }) => user ?? null)
    .catch(() => null);
};

/**
 * Sign in as a Medusa admin user.
 *
 * @remarks
 * `user` is the actor type, not `customer` or `member`: the back office calls
 * `/admin/*`, which only that actor reaches. One person can hold several actor
 * ids on one auth identity, so an operator who is also a shopper signs in here
 * with the same email and gets a different token — the two cookies do not
 * collide, by name or by scope.
 *
 * Returns a result rather than throwing, so the form can say what went wrong
 * without a boundary; the message is deliberately the same for a bad email and
 * a bad password.
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const { token } = await (sdk.auth.$actorType.$authProvider.mutate({
      $actorType: 'user',
      $authProvider: 'emailpass',
      email,
      password
    } as never) as unknown as Promise<{ token: string }>);

    /* A token with an empty `actor_id` means the identity exists but carries no
       admin user — a customer trying the back office door. The API would answer
       401 on the first `/admin` call; refusing here keeps that out of the
       cookie and says something true instead. */
    if (!token || !actorIdOf(token)) {
      return { success: false, message: 'Akun ini tidak punya akses admin.' };
    }

    await setAuthToken(token);

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      message: 'Email atau kata sandi salah. Periksa kembali dan coba lagi.'
    };
  }
}

export async function signout() {
  await removeAuthToken();
  redirect(ROUTES.login);
}

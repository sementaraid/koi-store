'use server';

import { sdk } from '../client';

/** Sign in at `/auth/member/emailpass` with the account's own credentials
 * (D-003) and return the token.
 *
 * @remarks
 * The token is returned rather than stored: farm registration needs the
 * *first* token (empty `actor_id`, which `POST /vendor/sellers` accepts) and
 * then a second one carrying the new member id. `login()` is the one caller
 * that stores it.
 *
 * `member` is the actor type, not a second account: the identity is the same
 * one the customer token was minted from, so the same email and password sign
 * in on both. */
export async function memberSignIn(email: string, password: string): Promise<string> {
  const { token } = (await sdk.auth.$actorType.$authProvider.mutate({
    $actorType: 'member',
    $authProvider: 'emailpass',
    email,
    password
  } as never)) as unknown as { token: string };

  return token;
}

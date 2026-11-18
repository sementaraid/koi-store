'use server';

import { sdk } from '../client';

export async function memberSignIn(email: string, password: string): Promise<string> {
  const { token } = (await sdk.auth.$actorType.$authProvider.mutate({
    $actorType: 'member',
    $authProvider: 'emailpass',
    email,
    password
  } as never)) as unknown as { token: string };

  return token;
}

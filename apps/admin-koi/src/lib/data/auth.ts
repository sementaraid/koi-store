'use server';

import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders, removeAuthToken, setAuthToken } from '../cookies';
import { actorIdOf } from '../helpers/actor-id';

export type Admin = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export const retrieveAdmin = async (): Promise<Admin | null> => {
  const authHeaders = await getAuthHeaders();

  if (!('authorization' in authHeaders)) return null;

  return await (sdk.admin.users.me
    .query({
      fetchOptions: { headers: authHeaders, cache: 'no-store' }
    } as never) as unknown as Promise<{ user: Admin }>)
    .then(({ user }) => user ?? null)
    .catch(() => null);
};

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

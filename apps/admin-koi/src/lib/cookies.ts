import 'server-only';
import { cookies as nextCookies } from 'next/headers';

const TOKEN = '_koi_admin_jwt';

export const getAuthHeaders = async (): Promise<{ authorization: string } | {}> => {
  const cookies = await nextCookies();
  const token = cookies.get(TOKEN)?.value;

  if (!token) return {};

  return { authorization: `Bearer ${token}` };
};

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

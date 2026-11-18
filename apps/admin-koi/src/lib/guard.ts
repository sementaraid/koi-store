import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { retrieveAdmin, type Admin } from './data/auth';

export async function requireAdmin(from: string): Promise<Admin> {
  const admin = await retrieveAdmin();

  if (!admin) {
    redirect(`${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(from)}`);
  }

  return admin;
}

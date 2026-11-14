import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { retrieveAdmin, type Admin } from './data/auth';

/**
 * The operator behind a back office page, or the door back to sign-in.
 *
 * @param from - The path being guarded, so the form can return them to it.
 *
 * @remarks
 * Every page under `(app)` calls this, including through the layout: the whole
 * app is private, and a screen that renders its chrome before discovering
 * nobody is signed in has already leaked its shape. `redirect()` throws, so the
 * return type has no `null` in it and callers need no second check.
 *
 * ponytail: this is the only authorization in the MVP — any Medusa admin user
 * reaches every screen. The plan's roles (approve farms, adjust balances) are
 * one team today. Add a role check here when the house hires someone who should
 * see the queue but not move money.
 */
export async function requireAdmin(from: string): Promise<Admin> {
  const admin = await retrieveAdmin();

  if (!admin) {
    redirect(`${ROUTES.login}?sessionRequired=true&redirect=${encodeURIComponent(from)}`);
  }

  return admin;
}

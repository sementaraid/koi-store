'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** Every platform value an admin can tune (US-015, D-010). Integers only — no
    money math happens on amounts stored here, and the bank account is D-009's
    setting, not an env var. */
export type Settings = {
  extend_window_minutes: number;
  max_lots_per_auction: number;
  auction_min_days: number;
  auction_max_days: number;
  claim_window_hours: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
};

/** The current settings, or `null` when the fetch failed — the form shows an
    error state rather than one that quietly submits defaults. */
export const getSettings = async (): Promise<Settings | null> => {
  return sdk.admin.settings
    .query({
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-store'
      }
    })
    .then(({ settings }) => settings)
    .catch(() => null);
};

/** Save a partial change to the settings.
 *
 * @remarks
 * `/admin/settings` validates with a strict Zod schema (an unknown key is a
 * 400) and checks `auction_min_days <= auction_max_days` against the row
 * merged server-side, so a patch that only sends one of the two bounds is
 * still checked against the other's stored value. Either failure comes back
 * as a `ClientError` with the backend's own message — shown to the admin
 * instead of a generic "gagal menyimpan", since "the minimum can't exceed the
 * maximum" is what tells them which field to fix. */
export async function updateSettings(
  patch: Partial<Settings>
): Promise<{ success: true; settings: Settings } | { success: false; error: string }> {
  await requireAdmin(ROUTES.fees);

  return sdk.admin.settings
    .mutate({
      ...patch,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(({ settings }) => {
      revalidatePath(ROUTES.fees);
      return { success: true as const, settings };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan pengaturan.'
    }));
}

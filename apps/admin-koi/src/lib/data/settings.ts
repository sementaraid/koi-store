'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

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

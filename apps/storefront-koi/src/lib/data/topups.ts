'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

export type TopupRequestStatus = 'pending' | 'approved' | 'rejected';

export type TopupRequest = {
  id: string;
  amount: number;
  status: TopupRequestStatus;
  reason: string | null;
  has_screenshot: boolean;
  created_at: string;
};

export type TopupRequestsPage = {
  requests: TopupRequest[];
  count: number;
  limit: number;
  offset: number;
};

export const getTopupRequests = async (
  limit = 20,
  offset = 0
): Promise<TopupRequestsPage> => {
  const page = await sdk.store.topupRequests.query({
    limit,
    offset,
    fetchOptions: {
      headers: { ...(await getAuthHeaders()) },
      cache: 'no-cache'
    }
  });

  return page;
};

export type PlatformBankAccount = {
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
};

export const getPlatformBankAccount = async (): Promise<PlatformBankAccount> => {
  return sdk.store.platformBankAccount.query({
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
  });
};

export async function createTopupRequest(
  amount: number,
  screenshot: File
): Promise<{ success: true } | { success: false; error: string }> {
  return sdk.store.topupRequests
    .mutate({
      amount,
      screenshot,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.saldoTopup);
      return { success: true as const };
    })
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 401) {
        redirect(
          `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.saldoTopup)}`
        );
      }

      return {
        success: false as const,
        error: err instanceof ClientError ? err.message : 'Gagal mengirim permintaan top-up.'
      };
    });
}

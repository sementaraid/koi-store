'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

/** A top-up request's lifecycle (US-011 AC2, AC4; decided by US-012's admin
    review). */
export type TopupRequestStatus = 'pending' | 'approved' | 'rejected';

/** One screenshot the customer submitted, as `/store/topup-requests` returns
    it — `amount` is whole rupiah, and nothing here changes the balance until
    an admin approves it (US-011 AC2).
 *
 * @remarks
 * `has_screenshot` rather than a URL: the store route keeps screenshots
 * private (they carry account numbers), so the customer's own list only needs
 * to know one is attached. */
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

/** The signed-in customer's top-up requests, newest first.
 *
 * @remarks
 * Throws rather than returning an empty page — same contract as
 * {@link import('./wallet.ts').getWallet}: an account with no requests yet is
 * `{ requests: [] }` from the route itself, which is real data, not a fetch
 * failure. The caller (the page) decides what a thrown error draws. */
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

/** The bank account top-ups are transferred to (D-009). */
export type PlatformBankAccount = {
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
};

/** The platform bank account, or a thrown error the page handles.
 *
 * @remarks
 * `/store/platform-bank-account` authenticates the customer (see the route's
 * middleware), so the token has to travel with the request — and a signed-out
 * or expired session answers 401. It must also never be cached: the account
 * is an admin setting, and `force-cache` here served a stale response to a
 * different viewer. Same contract as {@link getTopupRequests}: throw, and let
 * `TopupPage` decide between the session-expired redirect and an error state —
 * `.catch(() => null)` here hid the 401 behind the "not configured" copy. */
export const getPlatformBankAccount = async (): Promise<PlatformBankAccount> => {
  return sdk.store.platformBankAccount.query({
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
  });
};

/** Submit a transfer screenshot for a given amount (US-011 AC1–AC2).
 *
 * @remarks
 * `amount` and `screenshot` go straight to `sdk.store.topupRequests.mutate` —
 * the client turns a payload holding a `File` into `multipart/form-data`
 * itself (`payloadHasFiles` in `@mercurjs/client`), so no `FormData` is built
 * by hand here. */
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
      revalidatePath(ROUTES.topup);
      return { success: true as const };
    })
    .catch((err: unknown) => {
      /* The same "token expired mid-session" case `WalletPage` sends back to
         sign-in — `redirect()` inside a server action still navigates the
         caller, so the upload form needs no 401 branch of its own. */
      if (err instanceof ClientError && err.status === 401) {
        redirect(
          `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.topup)}`
        );
      }

      return {
        success: false as const,
        error: err instanceof ClientError ? err.message : 'Gagal mengirim permintaan top-up.'
      };
    });
}

'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { normalizeRejectReason } from '@/lib/helpers/farm-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** A farm's seller status (US-021). Rejection is Mercur's `suspended` (D-015). */
export type FarmStatus = 'pending_approval' | 'open' | 'suspended' | 'terminated';

/** The customer behind a farm registration (D-003). Their name is what the
    admin compares with the bank account's holder name. */
export type FarmApplicant = {
  customer_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

/** The farm PII fields the logged reveal accepts (D-042, US-092 T-092.5). */
export type FarmPiiField =
  | 'ktp_nik'
  | 'account_number'
  | 'holder_name'
  | 'phone'
  | 'applicant_phone';

/** One registration in the `/kebun` queue. The KTP photo is private and only
    its presence travels here (D-017); the bytes come from `getFarmKtp`.

    @remarks
    NIK, the account number, the holder name and both phones arrive already
    masked by the backend (D-042); `getFarmKtp` and `revealFarmPii` are the only
    ways to a full value. */
export type AdminFarm = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  status: FarmStatus;
  status_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  address: {
    address_1: string | null;
    city: string | null;
    province: string | null;
  } | null;
  payment_details: {
    holder_name: string | null;
    bank_name: string | null;
    account_number: string | null;
  } | null;
  ktp_nik: string | null;
  has_ktp_photo: boolean;
  farm_photo_urls: string[];
  applicant: FarmApplicant | null;
  /** Whether the bank account's holder matches the applicant (US-021 AC1).
      Computed server-side from the full values, because both are masked here.
      `null` means it cannot be compared: never read it as a match. */
  holder_matches_applicant: boolean | null;
};

type FarmList = {
  farms: AdminFarm[];
  count: number;
  limit: number;
  offset: number;
};

/* The client derives a query call's input from the route's `validatedBody`
   generic, which `/admin/farms` leaves `unknown` (its params are validated into
   `validatedQuery`), so the filter has to be passed the way `auth.ts` passes
   Medusa's `users.me`: the route itself is typed and the response below is
   still `FarmList`. */
/* ponytail: one page of 50 per status, no paging. The queue shows the total
   from `count` and says when it is capped. Add offset paging (or a "muat lagi"
   action) when a status regularly passes 50. */
const listByStatus = async (status: FarmStatus, limit = 50): Promise<FarmList> => {
  return sdk.admin.farms.query({
    status,
    limit,
    offset: 0,
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
  } as never) as unknown as Promise<FarmList>;
};

/** The queue, oldest registration first, split into what waits and what is
    decided.
 *
 * @remarks
 * Four calls, one per status: the route filters on one status at a time. The
 * decided lists are small next to the pending one, so they are fetched in
 * parallel rather than paged separately. Returns `null` on failure so the page
 * shows an error instead of an empty queue that reads as "nothing to approve".
 */
export const getFarmQueues = async (): Promise<{
  pending: AdminFarm[];
  pendingTotal: number;
  decided: AdminFarm[];
} | null> => {
  await requireAdmin(ROUTES.farms);

  try {
    const [pending, approved, suspended, terminated] = await Promise.all([
      listByStatus('pending_approval'),
      listByStatus('open'),
      listByStatus('suspended'),
      listByStatus('terminated')
    ]);

    return {
      pending: pending.farms,
      pendingTotal: pending.count,
      decided: [...approved.farms, ...suspended.farms, ...terminated.farms].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )
    };
  } catch {
    return null;
  }
};

type Result = { success: true } | { success: false; error: string };

/** Approve a registration: the farmer gains access (US-021 AC2). */
export async function approveFarm(id: string): Promise<Result> {
  await requireAdmin(ROUTES.farms);

  /* Mercur's lifecycle routes carry no body, and the client types their input
     as an empty record that rejects `$id`; same narrow cast as the other
     body-less admin calls. */
  return sdk.admin.sellers.$id.approve
    .mutate({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .then(() => {
      revalidatePath(ROUTES.farms);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyetujui kebun.'
    }));
}

/** Reject a registration with the reason the farmer reads (US-021 AC2–AC3).
 *
 * @remarks
 * Rejection is final and maps to Mercur's seller suspend (D-015). A blank
 * reason is refused here as well as in the form, because a server action can
 * be called without going through it.
 */
export async function rejectFarm(id: string, reason: string): Promise<Result> {
  await requireAdmin(ROUTES.farms);

  const trimmed = normalizeRejectReason(reason);
  if (!trimmed) {
    return { success: false, error: 'Masukkan alasan penolakan.' };
  }

  return sdk.admin.sellers.$id.suspend
    .mutate({
      $id: id,
      reason: trimmed,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .then(() => {
      revalidatePath(ROUTES.farms);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menolak kebun.'
    }));
}

/** The full value of one farm PII field, through the audit-logged route
 * (US-092 T-092.5, D-042).
 *
 * @remarks
 * Called only from an explicit "Tampilkan" click: every call appends one audit
 * row on the backend (who, when, farm, field), so an automatic call on render
 * would defeat the log. The value is returned to the caller's state only and
 * never written anywhere else; the queue itself keeps showing the mask.
 */
export const revealFarmPii = async (
  id: string,
  field: FarmPiiField
): Promise<{ value: string | null } | { error: string }> => {
  await requireAdmin(ROUTES.farms);

  try {
    const result = await sdk.admin.farms.$id.reveal.mutate({
      $id: id,
      field,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    return { value: result.value };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal menampilkan nilai.'
    };
  }
};

/** The KTP photo bytes, base64-encoded, for the client to turn into a blob URL.
 *
 * @remarks
 * Never a stored URL (D-017): the bytes come from the admin-only route with the
 * admin token. Same transport as the top-up screenshot: base64 because it is a
 * string across the server-action boundary. `Accept` is deliberately not JSON,
 * so `@mercurjs/client` hands back the raw `Response`.
 */
export const getFarmKtp = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  await requireAdmin(ROUTES.farms);

  try {
    const response = await sdk.admin.farms.$id.ktp.query({
      $id: id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()), Accept: 'image/*' },
        cache: 'no-store'
      }
    });

    if (!(response instanceof Response)) {
      return { error: 'Foto KTP tidak dapat dimuat.' };
    }

    return {
      data: Buffer.from(await response.arrayBuffer()).toString('base64'),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream'
    };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal memuat foto KTP.'
    };
  }
};

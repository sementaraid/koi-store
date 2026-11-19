'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { normalizeRejectReason } from '@/lib/helpers/farm-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type FarmStatus = 'pending_approval' | 'open' | 'suspended' | 'terminated';

export type FarmApplicant = {
  customer_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

export type FarmPiiField =
  | 'ktp_nik'
  | 'account_number'
  | 'holder_name'
  | 'phone'
  | 'applicant_phone';

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
  holder_matches_applicant: boolean | null;
};

type FarmList = {
  farms: AdminFarm[];
  count: number;
  limit: number;
  offset: number;
};

const listByStatus = async (status: FarmStatus, limit = 50): Promise<FarmList> => {
  return sdk.admin.farms.query({
    status,
    limit,
    offset: 0,
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
  } as never) as unknown as Promise<FarmList>;
};

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

export async function approveFarm(id: string): Promise<Result> {
  await requireAdmin(ROUTES.farms);

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

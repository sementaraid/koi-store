'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { authErrorMessage } from '../helpers/auth-error';
import type { FarmRegistrationData } from '../helpers/farm-schema';
import { tokenActorId } from '../helpers/token';
import { getAuthHeaders, getMemberAuthHeaders, setMemberToken } from './cookies';
import { retrieveCustomer } from './customer';
import { memberSignIn } from './member';

export type FarmSeller = {
  id: string;
  name: string;
  status: string;
  status_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
};

export type FarmUploads = {
  ktp_photo_key?: string;
  farm_photo_urls?: string[];
};

export type FarmStep = 'session' | 'signin' | 'upload' | 'register' | 'member';

export type FarmRegistrationResult =
  | { ok: true }
  | { ok: false; step: FarmStep; message: string; uploads: FarmUploads };

export async function getMyFarm(): Promise<FarmSeller | null> {
  const headers = await getMemberAuthHeaders();
  if (!('authorization' in headers)) return null;

  const page = await sdk.vendor.sellers
    .query({ fetchOptions: { headers, cache: 'no-store' } })
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 401) return null;
      throw err;
    });

  const seller = page?.seller_members?.[0]?.seller;
  if (!seller) return null;

  return {
    id: seller.id,
    name: seller.name,
    status: seller.status,
    status_reason: seller.status_reason ?? null,
    rejected_at: seller.rejected_at ? new Date(seller.rejected_at).toISOString() : null,
    approved_at: seller.approved_at ? new Date(seller.approved_at).toISOString() : null
  };
}

async function uploadFarmFile(
  purpose: 'ktp' | 'farm',
  file: File,
  headers: { authorization: string }
) {
  const payload = { purpose, file, fetchOptions: { headers } };
  return sdk.store.farmUploads.mutate(payload);
}

export async function registerFarm(
  data: FarmRegistrationData,
  ktp: File,
  farmPhotos: File[],
  uploads: FarmUploads = {}
): Promise<FarmRegistrationResult> {
  const customerHeaders = await getAuthHeaders();
  if (!('authorization' in customerHeaders)) {
    return {
      ok: false,
      step: 'session',
      message: 'Sesi Anda telah berakhir. Masuk lagi untuk melanjutkan.',
      uploads
    };
  }

  const customer = await retrieveCustomer();
  if (!customer) {
    return {
      ok: false,
      step: 'session',
      message: 'Sesi Anda telah berakhir. Masuk lagi untuk melanjutkan.',
      uploads
    };
  }

  let memberToken: string;
  try {
    memberToken = await memberSignIn(customer.email, data.password);
  } catch (err) {
    return {
      ok: false,
      step: 'signin',
      message: authErrorMessage(
        err,
        'Email atau kata sandi akun salah. Periksa kembali dan coba lagi.'
      ),
      uploads
    };
  }

  const nextUploads: FarmUploads = {
    ktp_photo_key: uploads.ktp_photo_key,
    farm_photo_urls: [...(uploads.farm_photo_urls ?? [])].slice(0, farmPhotos.length)
  };

  try {
    if (!nextUploads.ktp_photo_key) {
      const result = await uploadFarmFile('ktp', ktp, customerHeaders);
      nextUploads.ktp_photo_key = result.file_key;
    }

    for (let i = nextUploads.farm_photo_urls!.length; i < farmPhotos.length; i++) {
      const result = await uploadFarmFile('farm', farmPhotos[i], customerHeaders);
      if (!result.url) {
        throw new Error('Foto kebun tidak mendapat tautan dari server.');
      }
      nextUploads.farm_photo_urls!.push(result.url);
    }
  } catch (err) {
    return {
      ok: false,
      step: 'upload',
      message: err instanceof ClientError ? err.message : 'Gagal mengunggah berkas.',
      uploads: nextUploads
    };
  }

  try {
    await sdk.vendor.sellers.mutate({
      name: data.name,
      email: customer.email,
      currency_code: 'idr',
      description: data.description,
      member_email: customer.email,
      address: {
        address_1: data.address1,
        city: data.city,
        province: data.province
      },
      payment_details: {
        holder_name: data.holderName,
        bank_name: data.bankName,
        account_number: data.accountNumber
      },
      additional_data: {
        ktp_photo_key: nextUploads.ktp_photo_key,
        ktp_nik: data.nik,
        farm_photo_urls: nextUploads.farm_photo_urls
      },
      fetchOptions: { headers: { authorization: `Bearer ${memberToken}` } }
    });
  } catch (err) {
    return {
      ok: false,
      step: 'register',
      message:
        err instanceof ClientError
          ? err.message
          : 'Pendaftaran gagal. Coba lagi sebentar lagi.',
      uploads: nextUploads
    };
  }

  try {
    const token = await memberSignIn(customer.email, data.password);
    if (!token || !tokenActorId(token)) {
      throw new Error('member actor missing');
    }
    await setMemberToken(token);
  } catch {
    return {
      ok: false,
      step: 'member',
      message:
        'Pendaftaran tersimpan, tetapi sesi petani belum aktif. Masuk ulang dengan akun yang sama, lalu buka status pendaftaran.',
      uploads: nextUploads
    };
  }

  revalidatePath(ROUTES.farm);
  return { ok: true };
}

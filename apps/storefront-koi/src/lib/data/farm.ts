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

/** One farm's status, as the Farmer area needs it (US-020 AC3). */
export type FarmSeller = {
  id: string;
  name: string;
  status: string;
  status_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
};

/** Uploads already made for one registration attempt.
 *
 * @remarks
 * Returned on a failed submit so the form can hand them back on retry: a KTP
 * scan and a set of farm photos should not be uploaded twice because the seller
 * call after them failed. */
export type FarmUploads = {
  ktp_photo_key?: string;
  farm_photo_urls?: string[];
};

/** Which step of the registration failed — the customer is told exactly. */
export type FarmStep = 'session' | 'signin' | 'upload' | 'register' | 'member';

export type FarmRegistrationResult =
  | { ok: true }
  | { ok: false; step: FarmStep; message: string; uploads: FarmUploads };

/** The signed-in farmer's seller, or `null` when this account has none.
 *
 * @remarks
 * `GET /vendor/sellers` needs the member token (D-003's second login) and reads
 * the seller through the member link; `seller.*` carries `status_reason` too.
 * A 401 means the member cookie is absent or stale — the same answer as "no
 * registration", which draws the form. Any other failure is thrown, so the page
 * shows an error instead of claiming the customer never registered. */
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

/** One registration file through the customer-authenticated upload route
    (T-020.5). The typed client turns the `file` into multipart itself. */
async function uploadFarmFile(
  purpose: 'ktp' | 'farm',
  file: File,
  headers: { authorization: string }
) {
  /* A variable, not a literal: the generated route type declares only
     `purpose` in its body (multer keeps the file off `validatedBody`), while
     the handler reads `req.file` from the same multipart request. Passing the
     object by reference is what keeps this typed instead of cast. */
  const payload = { purpose, file, fetchOptions: { headers } };
  return sdk.store.farmUploads.mutate(payload);
}

/** Submit a farm registration (US-020 T-020.2).
 *
 * @remarks
 * D-003's sequence, in one action so a half-finished registration cannot be
 * left behind by a navigation:
 * 1. the customer token uploads the KTP (private) and the farm photos (public);
 * 2. a first member sign-in carries the empty `actor_id` `POST /vendor/sellers`
 *    expects;
 * 3. the same credentials sign in again — that token carries the new member id
 *    and is what every later `/vendor/*` call needs — and is kept in its own
 *    cookie.
 *
 * The account password is asked for on the form because the server only ever
 * holds a customer token, never the password needed to open the member session.
 * It is used here and not stored. */
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

  /* Upload what is not uploaded yet. The urls already made are kept in the
     same order as the chosen files, so a retry resumes rather than repeats. */
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
    /* `phone` is deliberately absent: the server copies the customer's
       registration phone (D-016) and ignores a body value. */
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

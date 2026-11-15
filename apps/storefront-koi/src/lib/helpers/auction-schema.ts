import { z } from 'zod';

/* Create-auction form rules (US-030 T-030.3), mirroring the server's own
   (`packages/api/src/api/vendor/auctions/validators.ts` and
   `workflows/steps/auction.ts`): whole-rupiah OB/KB, 1-20 lots, 1 photo per
   lot, 1-7 day length. The server is the only place these are enforced
   (T-030.4) — this schema only tells the farmer before a submit returns a
   400, the same role `farm-registration.ts` plays for registration. */

/** `max_lots_per_auction`'s default (`PLATFORM_SETTING_DEFAULTS`). Admin can
    raise or lower it; the server's own check is what actually binds. */
export const MAX_LOTS_PER_AUCTION = 20;

/** `auction_min_days` / `auction_max_days` defaults. Same caveat as above. */
export const AUCTION_MIN_DAYS = 1;
export const AUCTION_MAX_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole rupiah, same bound as the server's 4-byte integer column. Plain
// `z.number()`, not `z.coerce.number()`: the form's `register(..., {
// valueAsNumber: true })` already turns the input into a number (or `NaN` for
// an empty field, which `.int()` below then refuses) — the same split
// `SettingsForm` in admin-koi uses, and it keeps this schema's input and
// output types identical for `zodResolver`.
const rupiah = z
  .number({ message: 'Masukkan angka' })
  .int('Harus bilangan bulat')
  .min(1, 'Harus lebih dari 0')
  .max(2_147_483_647, 'Nilai terlalu besar');

// Photos are not in this schema: they are uploaded (and their count checked by
// `lotPhotosError`) outside react-hook-form's validation, the same split the
// farm registration form uses for the KTP scan and farm photos.
export const lotSchema = z.object({
  title: z.string().trim().min(1, 'Masukkan judul lot').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
  ob: rupiah,
  kb: rupiah
});

export type LotFormData = z.infer<typeof lotSchema>;

/** The auction's own fields, shared by create and draft edit — the draft edit
    route accepts exactly these and no lots (`VendorUpdateAuction`). */
export const auctionFieldsSchema = z.object({
  fee_category_id: z.string().trim().min(1, 'Pilih kategori biaya'),
  start_at: z.string().min(1, 'Pilih waktu mulai'),
  end_at: z.string().min(1, 'Pilih waktu selesai'),
  delivery_method: z.enum(['self_delivery', 'courier'], { message: 'Pilih metode pengiriman' })
});

export type AuctionFieldsData = z.infer<typeof auctionFieldsSchema>;

/** The create form's shape: the auction's fields plus its lots (AC2). */
export const auctionSchema = auctionFieldsSchema.extend({
  lots: z
    .array(lotSchema)
    .min(1, 'Tambahkan minimal satu lot')
    .max(MAX_LOTS_PER_AUCTION, `Maksimal ${MAX_LOTS_PER_AUCTION} lot`)
});

/** The complaint about one lot's photo count, or `null` when it is
    acceptable (AC2: every lot needs at least one photo). */
export function lotPhotosError(count: number): string | null {
  if (count < 1) {
    return 'Unggah minimal satu foto untuk lot ini.';
  }
  return null;
}

export type AuctionFormData = z.infer<typeof auctionSchema>;

/** Jakarta's fixed UTC offset. The house quotes every time in WIB, the same
    convention `formatDeadline` uses — so a `datetime-local` value is read and
    written as WIB regardless of the browser's own zone. */
const JAKARTA_OFFSET = '+07:00';

/** An ISO instant as a `datetime-local` value (`YYYY-MM-DDTHH:mm`) in Jakarta
    time. Built with an explicit `timeZone`, so the server render and the
    browser render produce the same string — no hydration mismatch — and a
    farmer anywhere sees the house's own wall clock. */
export function jakartaInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso));
  // `sv-SE` formats as "2026-11-16 13:52"; the input wants the space as a `T`.
  return parts.replace(' ', 'T');
}

/** A `datetime-local` value, read as Jakarta wall clock, as an ISO instant —
    the inverse of {@link jakartaInputValue}. */
export function jakartaIso(local: string): string {
  return new Date(`${local}:00${JAKARTA_OFFSET}`).toISOString();
}

/** The complaint about an auction's length, or `null` when it is acceptable
    (AC1: 1-7 days, end after start). Takes the two datetime-local strings the
    form holds, not `Date`s, so a test needs no timezone setup. */
export function auctionLengthError(startLocal: string, endLocal: string): string | null {
  const start = Date.parse(startLocal);
  const end = Date.parse(endLocal);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'Pilih waktu mulai dan selesai.';
  }
  if (end <= start) {
    return 'Waktu selesai harus setelah waktu mulai.';
  }

  const days = (end - start) / DAY_MS;
  if (days < AUCTION_MIN_DAYS || days > AUCTION_MAX_DAYS) {
    return `Lelang harus berlangsung ${AUCTION_MIN_DAYS}-${AUCTION_MAX_DAYS} hari.`;
  }

  return null;
}

/** Whether a lot can be removed from a draft: the server refuses removing the
    last one (an auction needs at least one lot), so the UI hides the control
    at one lot rather than letting it 400. */
export function canRemoveLot(lotCount: number): boolean {
  return lotCount > 1;
}

/** Listing fee for a whole auction: the category's per-lot fee × lot count
    (D-032, AC4). Whole rupiah in, whole rupiah out — no money maths beyond
    this one multiplication, and the server recomputes it regardless. */
export function totalListingFee(listingFeePerLot: number, lotCount: number): number {
  return listingFeePerLot * lotCount;
}

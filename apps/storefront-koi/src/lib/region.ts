/**
 * The one country this storefront sells into.
 *
 * `apps/storefront` carries the country in a `[locale]` route segment and
 * validates it per request (`checkRegion`). This storefront is Indonesian only,
 * so there is no segment to read and nothing to validate — the country is a
 * setting, and every data call that needs one takes it from here.
 *
 * ponytail: a constant, not a resolver. If a second country is ever sold into,
 * this becomes the segment again and `COUNTRY_CODE` the fallback for it.
 */
export const COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'id';

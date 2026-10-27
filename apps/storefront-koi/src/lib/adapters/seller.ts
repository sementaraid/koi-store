import type { SellerDTO } from '@mercurjs/types';

import type { PartnerFarm } from '@/components/organisms/PartnerCard/PartnerCard';
import { partnerHref } from '@/const/routes';

/**
 * A Mercur seller → the kit's directory card.
 *
 * @remarks
 * The kit's `PartnerFarm` was written against the design's demo farms, which
 * publish a location, a rating and three counted figures. A real `SellerDTO`
 * publishes none of those: `GET /store/sellers` returns id, name, handle,
 * description, logo, banner, `is_premium` and `metadata`. So the three are
 * omitted rather than filled with zeroes — a farm card claiming `0.00` stars
 * and "0 kolam aktif" is worse than one that simply does not say.
 *
 * `metadata` is read for them where a seller has bothered to set them, because
 * that is the one place in Mercur's seller record where a marketplace can keep
 * its own facts about a seller. Anything absent or the wrong type is dropped.
 */
export function toPartnerFarm(seller: SellerDTO): PartnerFarm {
  const meta = (seller.metadata ?? {}) as Record<string, unknown>;

  const location = typeof meta.location === 'string' ? meta.location : undefined;
  const rating = typeof meta.rating === 'number' ? meta.rating : undefined;
  const speciality =
    typeof meta.speciality === 'string' ? meta.speciality : undefined;

  return {
    id: seller.id,
    name: seller.name,
    ...(location ? { location } : {}),
    ...(rating ? { rating } : {}),
    ...(speciality ? { speciality } : {}),
    /* The handle, not the id: the directory's URLs are readable, and the page
       behind them looks the seller up by handle. */
    href: partnerHref(seller.handle)
  };
}

/**
 * A Mercur seller → the facts a breeder's own page puts above its shelf.
 *
 * @remarks
 * A superset of {@link toPartnerFarm}'s reading: the card is a tile in a grid
 * and says as little as fits, while the page has room for the description the
 * breeder wrote and the date they joined. Both read the same record, so the
 * `metadata` conventions stay in one file.
 */
export type PartnerProfile = {
  id: string;
  name: string;
  /** What the breeder wrote about themselves. Plain text — see the remark on
      {@link toPartnerProfile}. */
  description?: string;
  /** The farm's own mark. Absent for most sellers; the page then draws the
      monogram the directory card draws. */
  logo?: string;
  /** Province and country, from `metadata.location`. */
  location?: string;
  /** Varieties bred, from `metadata.speciality`. */
  speciality?: string;
  /** Whether the house has the seller on its premium tier. */
  premium: boolean;
  /** When they joined, for the "Bergabung …" line. */
  joinedAt?: string;
};

/**
 * @remarks
 * `description` is passed as **text**, not HTML: `apps/storefront` renders the
 * same field through `dangerouslySetInnerHTML`, which trusts whatever a seller
 * typed into the vendor panel on the customer's origin. Nothing in koi does
 * that, and a breeder's bio is not worth an XSS sink — so the string is
 * rendered as a paragraph and any markup in it shows as the characters the
 * seller typed.
 *
 * `ponytail:` if sellers ever need formatted bios, sanitize server-side (the
 * vendor panel is the right place to restrict the editor) rather than lifting
 * the restriction here.
 */
export function toPartnerProfile(seller: SellerDTO): PartnerProfile {
  const meta = (seller.metadata ?? {}) as Record<string, unknown>;

  const location = typeof meta.location === 'string' ? meta.location : undefined;
  const speciality =
    typeof meta.speciality === 'string' ? meta.speciality : undefined;

  return {
    id: seller.id,
    name: seller.name,
    ...(seller.description ? { description: seller.description } : {}),
    ...(seller.logo ? { logo: seller.logo } : {}),
    ...(location ? { location } : {}),
    ...(speciality ? { speciality } : {}),
    premium: Boolean(seller.is_premium),
    ...(seller.created_at
      ? { joinedAt: new Date(seller.created_at).toISOString() }
      : {})
  };
}

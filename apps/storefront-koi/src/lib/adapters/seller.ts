import type { SellerDTO } from '@mercurjs/types';

import type { PartnerFarm } from '@/components/organisms/PartnerCard/PartnerCard';
import { partnerHref } from '@/const/routes';

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
    href: partnerHref(seller.handle)
  };
}

export type PartnerProfile = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  location?: string;
  speciality?: string;
  premium: boolean;
  joinedAt?: string;
};

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

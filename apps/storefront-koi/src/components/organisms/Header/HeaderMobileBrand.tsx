'use client';

import { usePathname } from 'next/navigation';

import { BackButton } from '@/components/cells/BackButton/BackButton';
import { BrandMark } from '@/components/cells/BrandMark/BrandMark';
import { ROUTES } from '@/const/routes';
import type { HeaderBrand } from '@/types/header';

/**
 * The leading control in the phone header. On an account sub-page the logo
 * becomes a back arrow to the account home, so a customer who followed the
 * account menu can step back; the account home itself keeps the logo. The
 * caller hides this branch from `lg`, so the desktop header never changes.
 */
export function HeaderMobileBrand({ brandIcon, brandHref }: HeaderBrand) {
  const pathname = usePathname();

  if (pathname.startsWith(`${ROUTES.account}/`)) {
    return (
      <BackButton
        href={ROUTES.account}
        label="Kembali"
        className="ms-0 size-11 rounded-full! [&_svg:not([class*='size-'])]:size-5"
      />
    );
  }

  return <BrandMark brandIcon={brandIcon} brandHref={brandHref} />;
}

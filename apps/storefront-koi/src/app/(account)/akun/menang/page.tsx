import { redirect } from 'next/navigation';

import { myBidsTabHref } from '@/const/routes';

// US-101 AC9: the old won-lot page duplicated the `Menang` tab. Old links keep
// working by landing on that tab instead.
export default function Page() {
  redirect(myBidsTabHref('menang'));
}

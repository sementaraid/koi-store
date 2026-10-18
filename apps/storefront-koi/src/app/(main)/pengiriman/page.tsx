import type { Metadata } from 'next';

import { Shipping } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Pengiriman',
  description: 'Ke mana pesanan dikirim, dan dengan apa.',
  robots: { index: false, follow: false }
};

/* No `Suspense` here, unlike the feeds: this section can `redirect` an empty
   cart, and a boundary above it would flush the shell first — the redirect then
   lands client-side and the response is a 200 instead of a 307. Awaiting the
   section keeps the status honest. */
export default function ShippingRoute() {
  return <Shipping />;
}

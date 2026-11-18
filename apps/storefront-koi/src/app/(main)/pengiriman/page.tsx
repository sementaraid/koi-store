import type { Metadata } from 'next';

import { Shipping } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Pengiriman',
  description: 'Ke mana pesanan dikirim, dan dengan apa.',
  robots: { index: false, follow: false }
};

export default function ShippingRoute() {
  return <Shipping />;
}

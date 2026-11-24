import { CheckoutSkeleton } from '@/components/sections/LoadingPages/LoadingPages';

export default function ShippingLoading() {
  return <CheckoutSkeleton label="Memuat pengiriman…" trail />;
}

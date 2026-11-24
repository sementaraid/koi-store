import {
  AuctionsLayout,
  AuctionsLoading
} from '@/components/sections/AuctionsPage/components/Auctions';

// The list's own fallback needs the tab; a route-level skeleton opens on the default one.
export default function AuctionsRouteLoading() {
  return (
    <AuctionsLayout>
      <AuctionsLoading tab="live" />
    </AuctionsLayout>
  );
}

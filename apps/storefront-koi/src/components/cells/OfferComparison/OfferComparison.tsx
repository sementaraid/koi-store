import { BadgeCheck, Store } from 'lucide-react';

import { Badge, RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { partnerHref } from '@/const/routes';
import { formatPrice } from '@/lib/helpers/format-price';
import type { OfferQuote } from '@/lib/adapters/product';

export type OfferComparisonProps = {
  offers: OfferQuote[];
  winnerId?: string;
  className?: string;
};

export function OfferComparison({
  offers,
  winnerId,
  className
}: OfferComparisonProps) {
  if (offers.length < 2) return null;

  return (
    <section className={className}>
      <h2 className="mb-3 text-2xs font-bold tracking-widest text-muted-foreground uppercase">
        Dijual oleh {offers.length} penjual
      </h2>

      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 truncate text-xs font-bold">
                <RenderIf when={offer.sellerHandle}>
                  {(handle) => (
                    <Link
                      href={partnerHref(handle)}
                      className="truncate hover:text-accent-ink hover:underline"
                    >
                      {offer.seller}
                    </Link>
                  )}
                </RenderIf>
                <RenderIf when={!offer.sellerHandle}>
                  {() => <span className="truncate">{offer.seller}</span>}
                </RenderIf>
                <RenderIf when={offer.premium}>
                  {() => (
                    <BadgeCheck
                      role="img"
                      aria-label="Mitra pilihan"
                      className="size-3.5 shrink-0 text-accent-ink"
                    />
                  )}
                </RenderIf>
              </span>
              <RenderIf when={offer.variant}>
                {(variant) => (
                  <span className="truncate text-2xs text-muted-foreground">
                    {variant}
                  </span>
                )}
              </RenderIf>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <RenderIf when={offer.id === winnerId}>
                {() => (
                  <Badge variant="attention" className="text-[11px]">
                    Pilihan
                  </Badge>
                )}
              </RenderIf>
              <RenderIf when={offer.stock <= 0}>
                {() => (
                  <Badge variant="muted" className="text-[11px]">
                    Stok habis
                  </Badge>
                )}
              </RenderIf>
              <span className="text-xs font-bold tabular-nums">
                {formatPrice(offer.price, offer.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
        <Store aria-hidden className="size-3" />
        Harga di atas termasuk jaminan rekber dari setiap penjual.
      </p>
    </section>
  );
}

'use client';

import { MessageSquareText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Card, RenderIf } from "@koi/ui";
import { Stars } from '@/components/atoms/Stars/Stars';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { deleteReview, type StoreReview } from '@/lib/data/reviews';
import { formatAgo } from '@/lib/helpers/format-ago';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';

/** How the house is still reading a pending review — shown instead of a tone
    that would claim it is already public. */
const STATUS_LABEL: Record<StoreReview['status'], string> = {
  pending: 'Menunggu tinjauan',
  published: 'Tayang',
  rejected: 'Ditolak'
};

/** Props for {@link Reviews}. */
export type ReviewsProps = {
  reviews: StoreReview[];
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * Every review the customer has written, newest first.
 *
 * @remarks
 * `/store/reviews` hands a review back without the `reference_id` it was
 * written against — see `lib/data/reviews.ts` — so a row here says "ulasan
 * produk" or "ulasan penjual" rather than naming the fish or the farm. The
 * subject is still known at the moment the review is written (the sheet that
 * opens from an order's parcel), just not at the moment this list reads it
 * back.
 */
export function Reviews({ reviews, openOrders, account, cart }: ReviewsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  async function remove(review: StoreReview) {
    if (!confirm('Hapus ulasan ini?')) return;

    setDeletingId(review.id);
    const result = await deleteReview(review.id);
    setDeletingId(null);

    if (!result.success) {
      toast.error('Gagal menghapus ulasan.');
      return;
    }
    /* `deleteReview` already revalidates the `reviews` tag for the next visit,
       but this list is drawn from props handed in on the request that is still
       on screen — dropped here too so the row does not wait for a reload. */
    setRemoved((prev) => new Set(prev).add(review.id));
    toast.success('Ulasan dihapus.');
  }

  const visible = reviews.filter((review) => !removed.has(review.id));

  return (
    <AccountFrame
      title="Ulasan"
      eyebrow={
        <>
          <MessageSquareText
            aria-hidden
            className="size-3.5"
          />
          Akun
        </>
      }
      description="Apa yang Anda tulis tentang farm dan koi yang sudah tiba."
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      <RenderIf when={visible.length ? visible : null}>
        {(list) => (
          <div className="grid gap-4">
            {list.map((review) => (
              <Card
                key={review.id}
                className="gap-3 p-5 [--card-spacing:--spacing(0)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Stars
                      value={review.rating}
                      size="md"
                    />
                    <p className="text-xs font-medium text-muted-foreground">
                      {review.reference === 'product' ? 'Ulasan koi' : 'Ulasan penjual'}
                      <RenderIf when={review.created_at}>
                        {(createdAt) => <> · {formatAgo(createdAt)}</>}
                      </RenderIf>
                    </p>
                  </div>
                  <Badge variant={review.status === 'published' ? 'info' : 'neutral'}>
                    {STATUS_LABEL[review.status]}
                  </Badge>
                </div>

                <RenderIf when={review.customer_note}>
                  {(note) => (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                      {note}
                    </p>
                  )}
                </RenderIf>

                <RenderIf when={review.seller_note}>
                  {(note) => (
                    <div className="mt-1 border-s-2 border-border ps-3">
                      <p className="text-xs font-bold text-foreground">Balasan penjual</p>
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  )}
                </RenderIf>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 self-start"
                  disabled={deletingId === review.id}
                  onClick={() => remove(review)}
                >
                  <Trash2
                    className="size-3.5"
                    aria-hidden
                  />
                  {deletingId === review.id ? 'Menghapus…' : 'Hapus'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </RenderIf>

      <RenderIf when={!visible.length}>
        {() => (
          <EmptyFeed
            icon={<MessageSquareText aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada ulasan"
            noMatchBody="Setelah pesanan Anda selesai, beri ulasan dari halaman pesanan."
          />
        )}
      </RenderIf>
    </AccountFrame>
  );
}

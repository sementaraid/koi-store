'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/atoms/Button/Button';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { reviewSubjects } from '@/lib/helpers/review-subjects';
import type { AccountOrder } from '@/types/order';

import { ReviewForm, type ReviewTarget } from './ReviewForm';

/** Props for {@link ParcelReviews}. */
export type ParcelReviewsProps = {
  /** The per-seller order the row belongs to — the farm, its items, and the
      statuses that decide whether a review is due at all. */
  order: AccountOrder;
};

/**
 * The row of "beri ulasan" buttons under a delivered parcel, and the sheet
 * they open.
 *
 * @remarks
 * Split out of `OrderDetail` rather than folded into it: the receipt is a
 * server component, and the sheet needs the state that picks which subject is
 * being rated. Nothing is drawn until the parcel has arrived — see
 * `reviewSubjects`, which is also where the one-subject-per-product rule and
 * the delivered-only gate are checked.
 *
 * ponytail: a subject already reviewed still shows its button, because
 * `GET /store/reviews` returns no `reference_id` to match against — the
 * backend refuses the duplicate and the sheet says so. Hide the button here
 * once the response carries the subject back.
 */
export function ParcelReviews({ order }: ParcelReviewsProps) {
  const [target, setTarget] = useState<ReviewTarget | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const subjects = reviewSubjects(order);
  if (!subjects.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
      <p className="me-auto text-xs font-medium text-muted-foreground uppercase">Beri ulasan</p>
      {subjects.map((subject) => (
        <Button
          key={`${subject.reference}-${subject.referenceId}`}
          variant="outline"
          size="sm"
          onClick={() => {
            setTarget({ ...subject, orderId: order.id });
            setOpen(true);
          }}
        >
          <Star
            className="size-3.5"
            aria-hidden
          />
          {subject.reference === 'seller' ? 'Penjual' : subject.name}
        </Button>
      ))}

      <RenderIf when={target}>
        {(it) => (
          <ReviewForm
            open={open}
            onOpenChange={setOpen}
            target={it}
          />
        )}
      </RenderIf>
    </div>
  );
}

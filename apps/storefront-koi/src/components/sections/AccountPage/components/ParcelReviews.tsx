'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { Button, RenderIf } from "@koi/ui";
import { reviewSubjects } from '@/lib/helpers/review-subjects';
import type { AccountOrder } from '@/types/order';

import { ReviewForm, type ReviewTarget } from './ReviewForm';

export type ParcelReviewsProps = {
  order: AccountOrder;
};

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

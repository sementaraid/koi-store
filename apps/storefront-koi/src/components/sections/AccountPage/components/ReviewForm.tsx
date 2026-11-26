'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Label, RenderIf, Textarea } from "@koi/ui";
import { StarsInput } from '@/components/atoms/Stars/Stars';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@koi/ui/primitives/sheet';
import { createReview } from '@/lib/data/reviews';
import type { ReviewSubject } from '@/lib/helpers/review-subjects';

import { reviewSchema, type ReviewData } from './schema';

export type ReviewTarget = ReviewSubject & {
  orderId: string;
};

export type ReviewFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: ReviewTarget;
};

export function ReviewForm({ open, onOpenChange, target }: ReviewFormProps) {
  // Derived from the review target: the order page can mount one form per
  // seller and koi in the group, and a `useId` here replays differently on the
  // server and the client under Next's bundled React.
  const id = target
    ? `review-${target.orderId}-${target.reference}-${target.referenceId}`
    : 'review-form';
  const ratingErrorId = `${id}-rating-error`;
  const noteErrorId = `${id}-note-error`;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReviewData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, note: '' }
  });

  async function submit(data: ReviewData) {
    if (!target) return;

    const result = await createReview({
      order_id: target.orderId,
      reference: target.reference,
      reference_id: target.referenceId,
      rating: data.rating,
      customer_note: data.note?.trim() ? data.note.trim() : null
    });

    if (!result.success) {
      toast.error(
        /already exists/i.test(result.error ?? '')
          ? 'Anda sudah menulis ulasan untuk ini.'
          : 'Gagal mengirim ulasan. Coba lagi.'
      );
      return;
    }

    toast.success('Ulasan terkirim. Menunggu ditinjau penjual.');
    reset({ rating: 0, note: '' });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Beri ulasan</SheetTitle>
          <SheetDescription>
            {target?.reference === 'product'
              ? `Bagaimana koi "${target.name}" yang Anda terima?`
              : `Bagaimana pengalaman Anda dengan ${target?.name ?? 'penjual'}?`}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid gap-5 overflow-y-auto px-4"
          noValidate
        >
          <div className="grid gap-1.5">
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <StarsInput
                  label={`Nilai untuk ${target?.name ?? 'penjual'}`}
                  value={field.value ?? 0}
                  onValueChange={field.onChange}
                  errorId={errors.rating ? ratingErrorId : undefined}
                />
              )}
            />
            <RenderIf when={errors.rating?.message}>
              {(message) => (
                <p
                  id={ratingErrorId}
                  role="alert"
                  className="text-xs text-destructive-ink"
                >
                  {message}
                </p>
              )}
            </RenderIf>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-note`}>Ulasan (opsional)</Label>
            <Textarea
              id={`${id}-note`}
              rows={5}
              maxLength={300}
              placeholder="Kondisi koi saat tiba, pengemasan, komunikasi penjual…"
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? noteErrorId : undefined}
              {...register('note')}
            />
            <RenderIf when={errors.note?.message}>
              {(message) => (
                <p
                  id={noteErrorId}
                  role="alert"
                  className="text-xs text-destructive-ink"
                >
                  {message}
                </p>
              )}
            </RenderIf>
          </div>

          <SheetFooter className="px-0">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mengirim…' : 'Kirim ulasan'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

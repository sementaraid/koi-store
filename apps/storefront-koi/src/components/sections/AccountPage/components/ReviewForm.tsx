'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useId } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/atoms/Button/Button';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { StarsInput } from '@/components/atoms/Stars/Stars';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { createReview } from '@/lib/data/reviews';
import type { ReviewSubject } from '@/lib/helpers/review-subjects';

import { reviewSchema, type ReviewData } from './schema';

/** What the sheet is being opened about: one subject, on one order. */
export type ReviewTarget = ReviewSubject & {
  /** The per-seller order the review is evidence of — the backend checks it
      belongs to the customer, and refuses a second review of the same subject
      on the same order. */
  orderId: string;
};

/** Props for {@link ReviewForm}. */
export type ReviewFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The farm or the koi being rated. Absent while the sheet is closed. */
  target?: ReviewTarget;
};

/**
 * The sheet that writes one review: a score, and optionally what the customer
 * wants to say about it.
 *
 * @remarks
 * A sheet, like `AddressForm`, for the same reason — the kit has no modal and
 * `ui/sheet.tsx` was already here.
 *
 * The score goes through a `Controller` rather than `register`: `StarsInput`
 * is a controlled group of radios reporting a number, not an input whose `ref`
 * and `onChange` can be spread onto it.
 *
 * The note is a bare `<textarea>` carrying the `Input` atom's own ring and
 * border classes: `FormField` wraps an `<input>`, and a 300-character review
 * typed into a one-line field is a field the customer cannot read back.
 */
export function ReviewForm({ open, onOpenChange, target }: ReviewFormProps) {
  const id = useId();
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
      /* The one failure worth its own words: the backend rejects a second
         review of the same subject on the same order, and "coba lagi" would
         send the customer back to a form that cannot succeed. */
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
            <textarea
              id={`${id}-note`}
              rows={5}
              maxLength={300}
              placeholder="Kondisi koi saat tiba, pengemasan, komunikasi penjual…"
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? noteErrorId : undefined}
              className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
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

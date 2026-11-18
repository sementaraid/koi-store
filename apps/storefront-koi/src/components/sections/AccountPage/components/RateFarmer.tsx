'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Label, RenderIf } from '@koi/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@koi/ui/primitives/sheet';
import { StarsInput } from '@/components/atoms';
import { rateLot } from '@/lib/data/lots';
import { ratingFailureInfo } from '@/lib/helpers/lot-rating';

import { reviewSchema, type ReviewData } from './schema';

const NOTE_MAX = 300;

/** Props for {@link RateFarmer}. */
export type RateFarmerProps = {
  /** The won lot whose farmer is being rated — the route is keyed by lot. */
  lotId: string;
  /** The farm's name, for the sheet's question. */
  sellerName: string;
};

/**
 * "Nilai kebun": the winner rates the farmer once, from `shipped` on
 * (US-057 T-057.2, AC1).
 *
 * @remarks
 * A button that opens a sheet, copied from `ReviewForm`: `StarsInput` through
 * a `Controller` (it is a controlled radio group, not an input whose `ref`
 * spreads), a bare `<textarea>` with a live counter, and `reviewSchema` — the
 * same 1–5 whole stars and 300 characters the backend enforces
 * (`StoreRateLot`), so the customer is told before the request.
 *
 * The row is re-read after a success instead of being painted here: the
 * server owns "once per lot" and the status gate. A refusal maps through
 * `ratingFailureInfo` (D-055) and refreshes a stale row.
 */
export function RateFarmer({ lotId, sellerName }: RateFarmerProps) {
  const router = useRouter();
  const id = useId();
  const ratingErrorId = `${id}-rating-error`;
  const noteErrorId = `${id}-note-error`;
  const [open, setOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ReviewData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, note: '' }
  });

  const noteLength = (watch('note') ?? '').length;

  async function submit(data: ReviewData) {
    const comment = data.note?.trim();
    const result = await rateLot(lotId, {
      stars: data.rating,
      ...(comment ? { comment } : {})
    });

    if (!result.success) {
      const info = ratingFailureInfo(result);
      toast.error(info.message);
      if (info.refresh) {
        reset({ rating: 0, note: '' });
        setOpen(false);
        router.refresh();
      }
      return;
    }

    toast.success('Terima kasih, penilaian terkirim.');
    reset({ rating: 0, note: '' });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Star aria-hidden className="size-3" />
        Nilai kebun
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nilai kebun</SheetTitle>
            <SheetDescription>
              Bagaimana pengalaman Anda dengan {sellerName}? Penilaian ini hanya bisa dikirim
              sekali untuk lot ini.
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
                    label={`Nilai untuk ${sellerName}`}
                    value={field.value ?? 0}
                    onValueChange={field.onChange}
                    errorId={errors.rating ? ratingErrorId : undefined}
                  />
                )}
              />
              <RenderIf when={errors.rating?.message}>
                {(message) => (
                  <p id={ratingErrorId} role="alert" className="text-xs text-destructive-ink">
                    {message}
                  </p>
                )}
              </RenderIf>
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${id}-note`}>Komentar (opsional)</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {noteLength}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id={`${id}-note`}
                rows={5}
                maxLength={NOTE_MAX}
                placeholder="Kondisi koi saat tiba, pengemasan, komunikasi peternak…"
                aria-invalid={errors.note ? true : undefined}
                aria-describedby={errors.note ? noteErrorId : undefined}
                className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
                {...register('note')}
              />
              <RenderIf when={errors.note?.message}>
                {(message) => (
                  <p id={noteErrorId} role="alert" className="text-xs text-destructive-ink">
                    {message}
                  </p>
                )}
              </RenderIf>
            </div>

            <SheetFooter className="px-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim…' : 'Kirim penilaian'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

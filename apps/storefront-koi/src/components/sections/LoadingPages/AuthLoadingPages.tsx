import { cn } from 'cn';

import { Skeleton } from '@koi/ui';
import { CONTAINER } from '@/const/layout';

import { LoadingRegion, TrailSkeleton } from './LoadingPages';

/*
 * Loading skeletons for the auth routes under (auth) (US-107 AC9-AC11). They repeat
 * AuthFrame's boxes: the breadcrumb strip, then the centred max-w-md card (eyebrow, title,
 * lede, fields) and the link line below it. Card heights were measured on the loaded
 * pages at 390 and 1440 px, so the footer does not move when the form arrives.
 */

function AuthSkeleton({
  label,
  card,
  fields,
  aside = true
}: {
  label: string;
  /** Height of the card at 390 px and from `sm` up. */
  card: string;
  fields: number;
  /** The link line below the card (not on the new-password form). */
  aside?: boolean;
}) {
  return (
    <LoadingRegion label={label}>
      <TrailSkeleton />
      <div className={cn(CONTAINER, 'flex justify-center py-10 sm:py-16')}>
        <div className="w-full max-w-md">
          <div
            className={cn(
              'flex flex-col gap-6 overflow-hidden rounded-xl border border-border bg-card p-6',
              card
            )}
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[14px] w-24" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex flex-col gap-4">
              {Array.from({ length: fields }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
          {aside ? <Skeleton className="mx-auto mt-5 h-5 w-56 max-w-full" /> : null}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function LoginSkeleton() {
  return <AuthSkeleton label="Memuat halaman masuk…" card="h-[420px] sm:h-[396px]" fields={2} />;
}

export function RegisterSkeleton() {
  return <AuthSkeleton label="Memuat halaman daftar…" card="h-[754px] sm:h-[614px]" fields={5} />;
}

export function ForgotPasswordSkeleton() {
  return <AuthSkeleton label="Memuat halaman lupa sandi…" card="h-[296px] sm:h-[280px]" fields={1} />;
}

// The form with a token (without one the page shows a short error card instead).
export function NewPasswordSkeleton() {
  return (
    <AuthSkeleton
      label="Memuat halaman atur sandi…"
      card="h-[456px] sm:h-[412px]"
      fields={2}
      aside={false}
    />
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@koi/ui';

import { AdminEmpty } from './AdminEmpty';

// The admin app's one error state. Server-rendered lists retry by refreshing
// their route, the same shape as the storefront's `RetryButton`. Announced to
// screen readers and always offers an action.
export type AdminErrorProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function AdminError({
  title = 'Gagal memuat data',
  description = 'Muat ulang halaman untuk mencoba lagi.',
  className
}: AdminErrorProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <AdminEmpty
      role="alert"
      className={className}
      icon={<AlertIcon />}
      title={title}
      description={description}
      action={
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => start(() => router.refresh())}
        >
          {pending ? 'Memuat…' : 'Coba lagi'}
        </Button>
      }
    />
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

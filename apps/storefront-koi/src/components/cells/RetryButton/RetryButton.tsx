'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@koi/ui';

// Server-rendered lists retry by refreshing their route.
export function RetryButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button disabled={pending} onClick={() => start(() => router.refresh())}>
      {pending ? 'Memuat…' : 'Coba lagi'}
    </Button>
  );
}

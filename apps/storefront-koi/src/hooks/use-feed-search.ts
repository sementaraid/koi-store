'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { GoodsFilter } from '@/types/product';

/**
 * A feed's filter and page, read from and written to the URL.
 *
 * The koi pages are stateless by design — `filter` and `page` are the caller's,
 * and changes come back through `onFilterChange` / `onPageChange`. On the web
 * that caller is the query string: a filtered feed is then shareable, survives
 * a refresh, and is what a "back" from a product page returns to.
 *
 * One hook for all three feeds, because all three take the same
 * `FeedState` shape; what differs is the slice of URLs each searches.
 */
export function useFeedSearch<S extends string>(fallback: GoodsFilter<S>) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filter: GoodsFilter<S> = {
    status: (params.get('status') as S | 'all' | null) ?? fallback.status,
    category: params.get('category') ?? fallback.category,
    sort: (params.get('sort') as GoodsFilter<S>['sort'] | null) ?? fallback.sort
  };

  const page = Number(params.get('page')) || 1;

  /** Replace rather than push: a filter change is not a place to go back to. */
  const write = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    },
    [pathname, router]
  );

  const onFilterChange = useCallback(
    (next: GoodsFilter<S>) => {
      const q = new URLSearchParams(params.toString());
      /* Omitted rather than written blank, so the URL keeps only what narrows. */
      next.status === fallback.status || next.status === 'all'
        ? q.delete('status')
        : q.set('status', next.status);
      next.category
        ? q.set('category', next.category)
        : q.delete('category');
      next.sort === fallback.sort ? q.delete('sort') : q.set('sort', next.sort);
      /* A narrower filter is a different result set; page 4 of the last one
         usually does not exist. */
      q.delete('page');
      write(q);
    },
    [params, fallback, write]
  );

  const onPageChange = useCallback(
    (next: number) => {
      const q = new URLSearchParams(params.toString());
      next <= 1 ? q.delete('page') : q.set('page', String(next));
      write(q);
    },
    [params, write]
  );

  return { filter, page, onFilterChange, onPageChange };
}

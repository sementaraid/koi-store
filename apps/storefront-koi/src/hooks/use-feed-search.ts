'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { readAttributeSelection } from '@/lib/helpers/attribute-facets';
import type { AttributeSelection, GoodsFilter } from '@/types/product';

export function useFeedSearch<S extends string>(
  fallback: GoodsFilter<S>,
  attributeHandles: string[] = []
) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filter: GoodsFilter<S> = {
    status: (params.get('status') as S | 'all' | null) ?? fallback.status,
    category: params.get('category') ?? fallback.category,
    sort: (params.get('sort') as GoodsFilter<S>['sort'] | null) ?? fallback.sort
  };

  const page = Number(params.get('page')) || 1;

  const selected = readAttributeSelection(
    attributeHandles.map((handle) => ({ handle, label: handle, values: [] })),
    Object.fromEntries(params.entries())
  );

  const write = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      // Push, not replace: every filter change is its own history entry, so
      // the back button undoes the last filter instead of leaving the feed.
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    },
    [pathname, router]
  );

  const onFilterChange = useCallback(
    (next: GoodsFilter<S>) => {
      const q = new URLSearchParams(params.toString());
      next.status === fallback.status || next.status === 'all'
        ? q.delete('status')
        : q.set('status', next.status);
      next.category
        ? q.set('category', next.category)
        : q.delete('category');
      next.sort === fallback.sort ? q.delete('sort') : q.set('sort', next.sort);
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

  const onAttributesChange = useCallback(
    (next: AttributeSelection) => {
      const q = new URLSearchParams(params.toString());
      for (const handle of attributeHandles) {
        next[handle] ? q.set(handle, next[handle]) : q.delete(handle);
      }
      q.delete('page');
      write(q);
    },
    [params, attributeHandles, write]
  );

  return { filter, page, selected, onFilterChange, onPageChange, onAttributesChange };
}

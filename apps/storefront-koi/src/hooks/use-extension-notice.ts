'use client';

import * as React from 'react';

import { extensionNotice, type BidNotice } from '@/lib/helpers/bid-status';
import type { CountdownTarget } from '@/lib/helpers/format-ago';

// US-099 AC10: watch the lot's end time across polls. The first render only
// records it; a later poll with a later time raises the notice. The hook owns
// no timer and adds no animation, so the panel never flashes: the line appears
// once and follows the newest end time.
export function useExtensionNotice(
  end: CountdownTarget | undefined,
  extendWindowMinutes: number,
  enabled: boolean,
  resetKey: string
): BidNotice | null {
  const [notice, setNotice] = React.useState<BidNotice | null>(null);
  const lastEnd = React.useRef<CountdownTarget | undefined>(end);
  // Moving to another lot must not read its end as an extension of this one.
  const lastKey = React.useRef(resetKey);

  React.useEffect(() => {
    const previous = lastEnd.current;
    lastEnd.current = end;

    if (lastKey.current !== resetKey) {
      lastKey.current = resetKey;
      setNotice(null);
      return;
    }

    if (!enabled || !previous || !end) return;

    const next = extensionNotice({
      previousEnd: previous,
      currentEnd: end,
      extendWindowMinutes
    });
    if (next) setNotice(next);
  }, [end, extendWindowMinutes, enabled, resetKey]);

  return notice;
}

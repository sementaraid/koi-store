'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

import { shellBalanceStale } from '@/lib/helpers/balance-sync';

const ShellBalanceContext = createContext<number | undefined>(undefined);

/** Carries the balance the layout rendered in the header chip down to the page. */
export function ShellBalanceProvider({
  balance,
  children
}: {
  balance: number | undefined;
  children: ReactNode;
}) {
  return <ShellBalanceContext.Provider value={balance}>{children}</ShellBalanceContext.Provider>;
}

/**
 * US-107 AC8: a page that shows the balance refreshes the layout once when its
 * own read disagrees with the chip. The layout is not re-rendered by a client
 * navigation inside its route group, so without this the chip could lag.
 */
export function useBalanceSync(pageBalance: number | null | undefined) {
  const shell = useContext(ShellBalanceContext);
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    if (refreshed.current || !shellBalanceStale(shell, pageBalance)) return;
    refreshed.current = true;
    router.refresh();
  }, [shell, pageBalance, router]);
}

export function BalanceSync({ balance }: { balance: number | null | undefined }) {
  useBalanceSync(balance);
  return null;
}

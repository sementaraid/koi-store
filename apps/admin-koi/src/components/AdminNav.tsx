'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { NAV } from '@/const/nav';

export function AdminNav({
  activeHref,
  onNavigate,
  className
}: {
  activeHref?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  // The layout has no pathname, so the current route marks the active item;
  // `activeHref` still wins when a caller passes one.
  const pathname = usePathname();
  const current = activeHref ?? pathname;

  return (
    <nav className={cn('grid gap-5', className)}>
      {NAV.map((group) => (
        <div key={group.label} className="grid gap-1">
          <p className="px-2 text-2xs font-bold tracking-widest text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.items.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={item.href === current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-0',
                  item.href === current && 'bg-sidebar-accent font-medium'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <p
                key={item.href}
                className="px-2 py-1.5 text-sm text-muted-foreground/60"
                title="Belum tersedia"
              >
                {item.label}
                <span className="sr-only"> (belum tersedia)</span>
              </p>
            )
          )}
        </div>
      ))}
    </nav>
  );
}

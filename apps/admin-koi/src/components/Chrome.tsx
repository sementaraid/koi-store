import Link from 'next/link';
import { cn } from 'cn';

import { NAV } from '@/const/nav';
import { ROUTES } from '@/const/routes';
import { SITE_NAME } from '@/const/site';
import type { Admin } from '@/lib/data/auth';

import { Button } from '@koi/ui';

export function Chrome({
  admin,
  activeHref,
  children
}: {
  admin: Admin;
  activeHref?: string;
  children: React.ReactNode;
}) {
  const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-sidebar px-4 py-5 md:min-h-dvh md:border-r md:border-b-0">
        <Link href={ROUTES.home} className="block px-2">
          <p className="text-2xs font-bold tracking-widest text-muted-foreground uppercase">
            Admin
          </p>
          <p className="font-medium">{SITE_NAME}</p>
        </Link>

        <nav className="mt-6 grid gap-5">
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
                    aria-current={item.href === activeHref ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-0',
                      item.href === activeHref && 'bg-sidebar-accent font-medium'
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
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
          <p className="truncate text-sm text-muted-foreground">
            Masuk sebagai <span className="text-foreground">{name}</span>
          </p>
          <form action={ROUTES.signout} method="post">
            <Button
              type="submit"
              variant="outline"
              className="h-11 px-3 text-xs md:h-8 md:px-2.5"
            >
              Keluar
            </Button>
          </form>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

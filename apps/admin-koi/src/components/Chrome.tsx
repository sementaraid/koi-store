'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/const/routes';
import { SITE_NAME } from '@/const/site';
import type { Admin } from '@/lib/data/auth';

import { Button } from '@koi/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@koi/ui/primitives/sheet';

import { AdminNav } from './AdminNav';

const RAIL_KEY = 'koi-admin-rail-collapsed';

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-5"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href={ROUTES.home} onClick={onNavigate} className="block px-2">
      <p className="text-2xs font-bold tracking-widest text-muted-foreground uppercase">Admin</p>
      <p className="font-medium">{SITE_NAME}</p>
    </Link>
  );
}

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
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The rail state is a per-viewer preference, so the first render matches the
  // server and the stored value is applied after mount.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(RAIL_KEY) === '1');
    } catch {
      // storage can be blocked; the rail stays expanded
    }
  }, []);

  function toggleRail() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(RAIL_KEY, next ? '1' : '0');
      } catch {
        // storage can be blocked; the toggle still works for this visit
      }
      return next;
    });
  }

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
          <SheetTrigger
            render={<Button variant="ghost" size="icon-md" className="shrink-0 md:hidden" />}
            aria-label="Buka menu"
          >
            <MenuIcon />
          </SheetTrigger>

          <Button
            type="button"
            variant="ghost"
            size="icon-md"
            className="hidden shrink-0 md:inline-flex"
            aria-label={collapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}
            aria-expanded={!collapsed}
            aria-controls="admin-rail"
            onClick={toggleRail}
          >
            <MenuIcon />
          </Button>

          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            Masuk sebagai <span className="text-foreground">{name}</span>
          </p>

          <form action={ROUTES.signout} method="post">
            <Button type="submit" variant="outline" className="h-11 px-3 text-xs md:h-8 md:px-2.5">
              Keluar
            </Button>
          </form>
        </header>

        <div className="flex min-h-0 flex-1">
          {!collapsed && (
            <aside
              id="admin-rail"
              className="hidden w-64 shrink-0 border-e border-border bg-sidebar px-4 py-5 md:block"
            >
              <Brand />
              <AdminNav activeHref={activeHref} className="mt-6" />
            </aside>
          )}

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>

      <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 bg-sidebar p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <Brand onNavigate={() => setDrawerOpen(false)} />
        </SheetHeader>
        <AdminNav
          activeHref={activeHref}
          onNavigate={() => setDrawerOpen(false)}
          className="overflow-y-auto px-4 py-5"
        />
      </SheetContent>
    </Sheet>
  );
}

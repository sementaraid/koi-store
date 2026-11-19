import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { NAV } from '@/const/nav';

export const metadata: Metadata = {
  title: 'Beranda'
};

export default function HomeRoute() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Beranda</h1>
        <p className="text-sm text-muted-foreground">
          Antrean dan pengaturan yang ditangani tim admin.
        </p>
      </div>

      {NAV.map((group) => (
        <section key={group.label} className="grid gap-3">
          <h2 className="text-2xs font-bold tracking-widest text-muted-foreground uppercase">
            {group.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <Card key={item.href}>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.hint}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {item.ready ? 'Siap digunakan.' : 'Belum tersedia.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

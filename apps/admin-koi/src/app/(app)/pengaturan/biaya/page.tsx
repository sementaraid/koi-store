import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { FeeTable } from '@/components/FeeTable';
import { SettingsForm } from '@/components/SettingsForm';
import { ROUTES } from '@/const/routes';
import { getFeeCategories } from '@/lib/data/fee-categories';
import { getSettings } from '@/lib/data/settings';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Tabel biaya'
};

/** Platform limits, the bank account (US-015), and the fee table (US-014). */
export default async function FeesRoute() {
  await requireAdmin(ROUTES.fees);
  const [settings, categories] = await Promise.all([getSettings(), getFeeCategories()]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Tabel biaya</h1>
        <p className="text-sm text-muted-foreground">
          Biaya listing dan join per kategori, plus jendela extend.
        </p>
      </div>

      {categories ? (
        <FeeTable categories={categories} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat tabel biaya</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}

      {settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat pengaturan</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}

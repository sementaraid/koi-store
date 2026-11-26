import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { FeeTable } from '@/components/FeeTable';
import { SettingsForm } from '@/components/SettingsForm';
import { ROUTES } from '@/const/routes';
import { getFeeCategories } from '@/lib/data/fee-categories';
import { getSettings } from '@/lib/data/settings';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Tabel biaya'
};

export default async function FeesRoute() {
  await requireAdmin(ROUTES.fees);
  const [settings, categories] = await Promise.all([getSettings(), getFeeCategories()]);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Tabel biaya"
        description="Biaya listing dan biaya ikut per lot, per kategori, plus jendela extend."
      />

      {categories ? (
        <FeeTable categories={categories} />
      ) : (
        <AdminError
          title="Gagal memuat tabel biaya"
          description="Kategori biaya tidak dapat dimuat."
        />
      )}

      {settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <AdminError
          title="Gagal memuat pengaturan"
          description="Pengaturan platform tidak dapat dimuat."
        />
      )}
    </div>
  );
}

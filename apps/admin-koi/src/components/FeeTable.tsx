'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField } from '@koi/ui';
import {
  createFeeCategory,
  deleteFeeCategory,
  updateFeeCategory,
  type FeeCategory
} from '@/lib/data/fee-categories';
import { feeCategoryLabel } from '@/lib/helpers/fee-category-label';

import { AdminEmpty } from './AdminEmpty';
import { ConfirmDialog } from './ConfirmDialog';

// D-070: the join fee is charged per lot, not per auction. The column and its
// payload stay `join_fee`; only the copy the admin reads changed.
const fee = (label: string) =>
  z.number({ message: `Masukkan ${label}` }).int('Harus bilangan bulat').min(0, 'Tidak boleh negatif');

const feesSchema = z.object({ listing_fee: fee('biaya listing'), join_fee: fee('biaya ikut') });
const newCategorySchema = feesSchema.extend({ name: z.string().trim().min(1, 'Wajib diisi') });

type FeesData = z.infer<typeof feesSchema>;
type NewCategoryData = z.infer<typeof newCategorySchema>;

export type FeeTableProps = {
  categories: FeeCategory[];
};

export function FeeTable({ categories }: FeeTableProps) {
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabel biaya</CardTitle>
        <CardDescription>
          Biaya listing per lot dan biaya ikut per lot, per kategori. Perubahan hanya berlaku
          untuk lelang yang dibuat setelah disimpan (US-014 AC3).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {categories.length === 0 ? (
          <AdminEmpty
            title="Belum ada kategori biaya"
            description="Tambahkan kategori pertama untuk mengatur biaya listing dan biaya ikut."
          />
        ) : (
          <div className="grid gap-3">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        )}

        {adding ? (
          <NewCategoryRow onDone={() => setAdding(false)} />
        ) : (
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              Tambah kategori
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({ category }: { category: FeeCategory }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<FeesData>({
    resolver: zodResolver(feesSchema),
    values: { listing_fee: category.listing_fee, join_fee: category.join_fee }
  });

  async function save(data: FeesData) {
    const result = await updateFeeCategory(category.id, data.listing_fee, data.join_fee);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Biaya ${feeCategoryLabel(category.name)} disimpan.`);
  }

  async function remove() {
    const result = await deleteFeeCategory(category.id);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Kategori ${feeCategoryLabel(category.name)} dihapus.`);
  }

  return (
    <form
      onSubmit={handleSubmit(save)}
      className="grid items-end gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
      noValidate
    >
      <div className="grid gap-1.5 sm:col-span-1">
        <span className="text-sm font-medium">Kategori</span>
        <span className="flex h-9 items-center text-sm text-foreground">
          {feeCategoryLabel(category.name)}
        </span>
      </div>
      <FormField
        id={`fee-${category.id}-listing`}
        label="Biaya listing (per lot)"
        type="number"
        min={0}
        step={1}
        error={errors.listing_fee?.message}
        {...register('listing_fee', { valueAsNumber: true })}
      />
      <FormField
        id={`fee-${category.id}-join`}
        label="Biaya ikut (per lot)"
        type="number"
        min={0}
        step={1}
        error={errors.join_fee?.message}
        {...register('join_fee', { valueAsNumber: true })}
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
        Simpan
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        Hapus
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus kategori biaya?"
        description={`Hapus kategori "${feeCategoryLabel(category.name)}"? Lelang yang sudah ada tidak berubah.`}
        confirmLabel="Hapus"
        busyLabel="Menghapus…"
        destructive
        onConfirm={remove}
      />
    </form>
  );
}

function NewCategoryRow({ onDone }: { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<NewCategoryData>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: { name: '', listing_fee: 0, join_fee: 0 }
  });

  async function submit(data: NewCategoryData) {
    const result = await createFeeCategory(data.name, data.listing_fee, data.join_fee);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Kategori ${data.name} ditambahkan.`);
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid items-end gap-3 rounded-md border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
      noValidate
    >
      <FormField label="Nama kategori" error={errors.name?.message} {...register('name')} />
      <FormField
        label="Biaya listing (per lot)"
        type="number"
        min={0}
        step={1}
        error={errors.listing_fee?.message}
        {...register('listing_fee', { valueAsNumber: true })}
      />
      <FormField
        label="Biaya ikut (per lot)"
        type="number"
        min={0}
        step={1}
        error={errors.join_fee?.message}
        {...register('join_fee', { valueAsNumber: true })}
      />
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Menambah…' : 'Tambah'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onDone}>
        Batal
      </Button>
    </form>
  );
}

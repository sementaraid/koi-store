'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Badge,
  Button,
  FormField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@koi/ui';
import {
  createFeeCategory,
  deleteFeeCategory,
  updateFeeCategory,
  type FeeCategory
} from '@/lib/data/fee-categories';
import { feeCategoryLabel } from '@/lib/helpers/fee-category-label';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';
import { ConfirmDialog } from './ConfirmDialog';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';

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
    <div className="grid gap-4">
      {categories.length === 0 && !adding ? (
        <AdminEmpty
          title="Belum ada kategori biaya"
          description="Tambahkan kategori pertama untuk mengatur biaya listing dan biaya ikut."
        />
      ) : (
        <Table label="Tabel biaya per kategori" minWidth="56rem">
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Biaya listing (per lot)</TableHead>
              <TableHead>Biaya ikut (per lot)</TableHead>
              <TableHead>Tindakan</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
            {adding ? <NewCategoryRow onDone={() => setAdding(false)} /> : null}
          </TableBody>
        </Table>
      )}

      {adding ? null : (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            Tambah kategori
          </Button>
        </div>
      )}
    </div>
  );
}

// A <form> cannot wrap a table row, so each row keeps a form of its own next to
// its buttons, and the inputs point at it with the `form` attribute.
function CategoryRow({ category }: { category: FeeCategory }) {
  const formId = `fee-form-${category.id}`;
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
    <TableRow>
      <TableCell>
        <p className="font-medium">{feeCategoryLabel(category.name)}</p>
      </TableCell>
      <TableCell>
        <FormField
          id={`fee-${category.id}-listing`}
          label="Biaya listing (per lot)"
          type="number"
          min={0}
          step={1}
          form={formId}
          error={errors.listing_fee?.message}
          {...register('listing_fee', { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <FormField
          id={`fee-${category.id}-join`}
          label="Biaya ikut (per lot)"
          type="number"
          min={0}
          step={1}
          form={formId}
          error={errors.join_fee?.message}
          {...register('join_fee', { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" form={formId} size="sm" disabled={isSubmitting || !isDirty}>
            Simpan
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            Hapus
          </Button>
        </div>
        <form id={formId} onSubmit={handleSubmit(save)} className="hidden" noValidate />

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
      </TableCell>
      <TableCell>
        <FeeCategoryDetail category={category} />
      </TableCell>
    </TableRow>
  );
}

function FeeCategoryDetail({ category }: { category: FeeCategory }) {
  const label = feeCategoryLabel(category.name);

  return (
    <DetailDialog
      triggerLabel={`Lihat detail kategori ${label}`}
      title="Detail kategori"
    >
      {() => (
        <>
          <DetailIdentity
            title={label}
            badge={<Badge variant="neutral">Kategori biaya</Badge>}
            secondary="Berlaku untuk lelang yang dibuat setelah disimpan."
          />

          <DetailPricePanel
            label="Biaya listing per lot"
            value={formatRupiah(category.listing_fee)}
            note={`Ikut per lot ${formatRupiah(category.join_fee)}`}
          />

          <DetailSection title="Biaya">
            <DetailItem label="Biaya listing (per lot)">
              {formatRupiah(category.listing_fee)}
            </DetailItem>
            <DetailItem label="Biaya ikut (per lot)">
              {formatRupiah(category.join_fee)}
            </DetailItem>
          </DetailSection>
        </>
      )}
    </DetailDialog>
  );
}

function NewCategoryRow({ onDone }: { onDone: () => void }) {
  const formId = 'fee-form-new';
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
    <TableRow>
      <TableCell>
        <FormField
          label="Nama kategori"
          form={formId}
          error={errors.name?.message}
          {...register('name')}
        />
      </TableCell>
      <TableCell>
        <FormField
          label="Biaya listing (per lot)"
          type="number"
          min={0}
          step={1}
          form={formId}
          error={errors.listing_fee?.message}
          {...register('listing_fee', { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <FormField
          label="Biaya ikut (per lot)"
          type="number"
          min={0}
          step={1}
          form={formId}
          error={errors.join_fee?.message}
          {...register('join_fee', { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" form={formId} size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Menambah…' : 'Tambah'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Batal
          </Button>
        </div>
        <form id={formId} onSubmit={handleSubmit(submit)} className="hidden" noValidate />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

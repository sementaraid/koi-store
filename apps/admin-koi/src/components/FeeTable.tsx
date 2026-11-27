'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { RowActions, type RowAction } from './RowActions';

// D-070: the join fee is charged per lot, not per auction. The column and its
// payload stay `join_fee`; only the copy the admin reads changed.
const fee = (label: string) =>
  z.number({ message: `Masukkan ${label}` }).int('Harus bilangan bulat').min(0, 'Tidak boleh negatif');

const feesSchema = z.object({ listing_fee: fee('biaya listing'), join_fee: fee('biaya ikut') });
const newCategorySchema = feesSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi')
    .max(80, 'Nama kategori maksimal 80 karakter')
});

type FeesData = z.infer<typeof feesSchema>;
type NewCategoryData = z.infer<typeof newCategorySchema>;

export type FeeTableProps = {
  categories: FeeCategory[];
};

export function FeeTable({ categories }: FeeTableProps) {
  return (
    <div className="grid gap-4">
      {categories.length === 0 ? (
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
          </TableBody>
        </Table>
      )}

      <div>
        <NewCategoryDialog />
      </div>
    </div>
  );
}

function CategoryRow({ category }: { category: FeeCategory }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const label = feeCategoryLabel(category.name);

  const actions: RowAction[] = [
    { label: 'Ubah kategori', onSelect: () => setDialog('edit') },
    {
      label: 'Hapus',
      tone: 'destructive',
      onSelect: () => {
        setDeleteError(null);
        setDialog('delete');
      }
    }
  ];

  async function remove() {
    setDeleteError(null);
    const result = await deleteFeeCategory(category.id);
    if (!result.success) {
      setDeleteError(result.error);
      toast.error(result.error);
      return;
    }
    setDialog(null);
    toast.success(`Kategori ${label} dihapus.`);
    router.refresh();
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{label}</p>
      </TableCell>
      <TableCell className="tabular-nums">{formatRupiah(category.listing_fee)}</TableCell>
      <TableCell className="tabular-nums">{formatRupiah(category.join_fee)}</TableCell>
      <TableCell>
        <div ref={triggerRef} className="inline-flex">
          <RowActions label={`Aksi kategori ${label}`} actions={actions} />
        </div>
      </TableCell>
      <TableCell>
        <FeeCategoryDetail category={category} />
      </TableCell>

      {dialog === 'edit' ? (
        <EditCategoryDialog
          category={category}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          finalFocus={() => triggerRef.current?.querySelector('button') ?? null}
        />
      ) : null}

      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setDeleteError(null);
          }
        }}
        title={`Hapus kategori ${label}?`}
        description={`Hapus kategori "${label}"? Lelang yang sudah ada tidak berubah. Kategori yang masih dipakai bisa ditolak server.`}
        confirmLabel="Hapus"
        busyLabel="Menghapus…"
        destructive
        error={deleteError}
        onConfirm={remove}
      />
    </TableRow>
  );
}

/* The dialog shows the old and new amounts and the explicit "Ya, simpan biaya"
   button, so it is the confirmation for a money change. */
function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  finalFocus
}: {
  category: FeeCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const label = feeCategoryLabel(category.name);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FeesData>({
    resolver: zodResolver(feesSchema),
    values: { listing_fee: category.listing_fee, join_fee: category.join_fee }
  });
  const values = watch();
  const nextListing = Number.isFinite(values.listing_fee)
    ? formatRupiah(values.listing_fee)
    : '—';
  const nextJoin = Number.isFinite(values.join_fee) ? formatRupiah(values.join_fee) : '—';

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) setApiError(null);
  }

  async function save(data: FeesData) {
    if (isSubmitting) return;
    setApiError(null);
    const result = await updateFeeCategory(category.id, data.listing_fee, data.join_fee);

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    toast.success(`Biaya ${label} disimpan.`);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={!isSubmitting} finalFocus={finalFocus}>
        <form onSubmit={handleSubmit(save)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Ubah kategori {label}</DialogTitle>
            <DialogDescription>
              Listing {formatRupiah(category.listing_fee)} → {nextListing}, ikut{' '}
              {formatRupiah(category.join_fee)} → {nextJoin}. Lelang yang sudah ada tidak
              berubah.
            </DialogDescription>
          </DialogHeader>

          <FormField
            id={`fee-${category.id}-listing`}
            label="Biaya listing (per lot)"
            type="number"
            min={0}
            step={1}
            disabled={isSubmitting}
            error={errors.listing_fee?.message}
            {...register('listing_fee', { valueAsNumber: true })}
          />
          <FormField
            id={`fee-${category.id}-join`}
            label="Biaya ikut (per lot)"
            type="number"
            min={0}
            step={1}
            disabled={isSubmitting}
            error={errors.join_fee?.message}
            {...register('join_fee', { valueAsNumber: true })}
          />

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal menyimpan biaya">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Ya, simpan biaya'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NewCategoryData>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: { name: '', listing_fee: 0, join_fee: 0 }
  });

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    setOpen(next);
    if (!next) {
      setApiError(null);
      reset();
    }
  }

  async function submit(data: NewCategoryData) {
    if (isSubmitting) return;
    setApiError(null);
    const result = await createFeeCategory(data.name, data.listing_fee, data.join_fee);

    if (!result.success) {
      setApiError(result.error);
      return;
    }

    toast.success(`Kategori ${data.name} ditambahkan.`);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Tambah kategori
      </DialogTrigger>
      <DialogContent showCloseButton={!isSubmitting}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Tambah kategori biaya</DialogTitle>
            <DialogDescription>
              Kategori baru dipakai untuk lelang yang dibuat setelah disimpan.
            </DialogDescription>
          </DialogHeader>

          <FormField
            id="fee-new-name"
            label="Nama kategori"
            maxLength={80}
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            id="fee-new-listing"
            label="Biaya listing (per lot)"
            type="number"
            min={0}
            step={1}
            disabled={isSubmitting}
            error={errors.listing_fee?.message}
            {...register('listing_fee', { valueAsNumber: true })}
          />
          <FormField
            id="fee-new-join"
            label="Biaya ikut (per lot)"
            type="number"
            min={0}
            step={1}
            disabled={isSubmitting}
            error={errors.join_fee?.message}
            {...register('join_fee', { valueAsNumber: true })}
          />

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal menambah kategori">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Ya, tambah kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

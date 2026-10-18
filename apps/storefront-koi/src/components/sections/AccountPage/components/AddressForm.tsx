'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/atoms/Button/Button';
import { FormField } from '@/components/cells/FormField/FormField';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { addCustomerAddress, updateCustomerAddress } from '@/lib/data/customer';

import { addressSchema, EMPTY_ADDRESS, type AddressData } from './schema';

/** Props for {@link AddressForm}. */
export type AddressFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The address being edited, with its Medusa id. Omitted, the sheet is
      "Tambah alamat" and submits a create instead of an update. */
  editing?: AddressData & { addressId: string };
};

/**
 * The sheet that adds or edits one shipping address.
 *
 * @remarks
 * A sheet rather than a modal: `apps/storefront` uses its own `Modal` here,
 * which this storefront does not have, and `src/components/ui/sheet.tsx` was
 * already in the kit, unused, waiting for exactly this.
 *
 * One form for both acts, branching on whether `editing` is present — the
 * fields are identical and `updateCustomerAddress` only differs from
 * `addCustomerAddress` by the id it carries.
 */
export function AddressForm({ open, onOpenChange, editing }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    /* `values`, not `defaultValues`: the same mounted sheet is reused for
       "tambah" and for each address edited, so the fields have to follow the
       prop rather than whatever they held the first time it opened. */
    values: editing ?? EMPTY_ADDRESS
  });

  async function submit(data: AddressData) {
    const form = new FormData();
    form.append('address_name', data.addressName ?? '');
    form.append('first_name', data.firstName);
    form.append('last_name', data.lastName);
    form.append('address_1', data.address1);
    form.append('city', data.city);
    form.append('province', data.province);
    form.append('postal_code', data.postalCode);
    form.append('country_code', data.countryCode);
    form.append('phone', data.phone);
    if (editing) form.append('addressId', editing.addressId);

    const result = editing
      ? await updateCustomerAddress(form)
      : await addCustomerAddress(form);

    if (!result.success) {
      toast.error('Gagal menyimpan alamat. Periksa kembali data Anda.');
      return;
    }

    toast.success(editing ? 'Alamat diperbarui.' : 'Alamat ditambahkan.');
    reset();
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? 'Ubah alamat' : 'Tambah alamat'}</SheetTitle>
          <SheetDescription>Alamat ini dipakai saat koi Anda dikirim.</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid gap-4 overflow-y-auto px-4"
          noValidate
        >
          <FormField
            label="Nama alamat (opsional)"
            placeholder="Rumah, Kantor…"
            error={errors.addressName?.message}
            {...register('addressName')}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Nama depan"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FormField
              label="Nama belakang"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          {/* ponytail: country is fixed to Indonesia — the house ships koi
              nowhere else, so a one-option select would be a control that only
              ever says the same thing. Swap this for the `NativeSelect` in
              `src/components/ui/native-select.tsx` when a second region opens. */}
          <input
            type="hidden"
            {...register('countryCode')}
          />

          <FormField
            label="Alamat lengkap"
            error={errors.address1?.message}
            {...register('address1')}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Kota"
              error={errors.city?.message}
              {...register('city')}
            />
            <FormField
              label="Provinsi"
              error={errors.province?.message}
              {...register('province')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Kode pos"
              inputMode="numeric"
              error={errors.postalCode?.message}
              {...register('postalCode')}
            />
            <FormField
              label="Telepon"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <SheetFooter className="px-0">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan…' : 'Simpan alamat'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import type { HttpTypes } from '@medusajs/types';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/atoms/Badge/Badge';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { deleteCustomerAddress } from '@/lib/data/customer';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';
import { AddressForm } from './AddressForm';
import type { AddressData } from './schema';

/** Props for {@link Addresses}. */
export type AddressesProps = {
  addresses: HttpTypes.StoreCustomerAddress[];
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/** An address row's edit target, read back out of the one it was shown for. */
function toFormData(address: HttpTypes.StoreCustomerAddress): AddressData & { addressId: string } {
  return {
    addressId: address.id,
    addressName: address.address_name ?? '',
    firstName: address.first_name ?? '',
    lastName: address.last_name ?? '',
    address1: address.address_1 ?? '',
    city: address.city ?? '',
    province: address.province ?? '',
    postalCode: address.postal_code ?? '',
    countryCode: address.country_code ?? 'id',
    phone: address.phone ?? ''
  };
}

/**
 * Every address the customer has saved, each one editable or removable in
 * place, with one sheet shared between "tambah" and every "ubah".
 *
 * @remarks
 * A delete asks `confirm()` rather than drawing its own dialog: this is the
 * one destructive action on the page, it happens rarely, and the native
 * prompt already blocks the double-click that would otherwise fire two
 * `deleteCustomerAddress` calls for one address.
 */
export function Addresses({ addresses, openOrders, account, cart }: AddressesProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<(AddressData & { addressId: string }) | undefined>(
    undefined
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function openEdit(address: HttpTypes.StoreCustomerAddress) {
    setEditing(toFormData(address));
    setSheetOpen(true);
  }

  async function remove(address: HttpTypes.StoreCustomerAddress) {
    if (!confirm(`Hapus alamat "${address.address_name || address.address_1}"?`)) return;

    setDeletingId(address.id);
    const result = await deleteCustomerAddress(address.id);
    setDeletingId(null);

    if (!result.success) {
      toast.error('Gagal menghapus alamat.');
      return;
    }
    toast.success('Alamat dihapus.');
  }

  return (
    <AccountFrame
      title="Alamat"
      eyebrow={
        <>
          <MapPin
            aria-hidden
            className="size-3.5"
          />
          Akun
        </>
      }
      description="Alamat yang dipakai saat koi Anda dikirim."
      action={
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          Tambah alamat
        </Button>
      }
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      <RenderIf when={addresses.length ? addresses : null}>
        {(list) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((address) => (
              <Card
                key={address.id}
                className="gap-3 p-5 [--card-spacing:--spacing(0)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">
                    {address.address_name || `${address.first_name} ${address.last_name}`}
                  </p>
                  <RenderIf when={address.is_default_shipping}>
                    {() => <Badge variant="info">Utama</Badge>}
                  </RenderIf>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {address.first_name} {address.last_name}
                  <br />
                  {address.address_1}
                  <br />
                  {address.city}, {address.province} {address.postal_code}
                  <br />
                  {address.phone}
                </p>

                <div className="mt-auto flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(address)}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Ubah
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === address.id}
                    onClick={() => remove(address)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {deletingId === address.id ? 'Menghapus…' : 'Hapus'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </RenderIf>

      <RenderIf when={!addresses.length}>
        {() => (
          <EmptyFeed
            icon={<MapPin aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada alamat"
            noMatchBody="Tambahkan alamat agar checkout koi Anda lebih cepat."
            action={<Button onClick={openCreate}>Tambah alamat</Button>}
          />
        )}
      </RenderIf>

      <AddressForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
      />
    </AccountFrame>
  );
}

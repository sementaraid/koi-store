'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  Alert,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@koi/ui';

// Replaces the native `confirm()` on money and destructive actions: a real
// dialog with Indonesian copy, a destructive variant, Esc to cancel and focus
// back on the control that opened it (Base UI restores it).
export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** The server's complaint, shown inside the dialog so it stays open. */
  error?: string | null;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Lanjutkan',
  busyLabel = 'Memproses…',
  cancelLabel = 'Batal',
  destructive = false,
  error = null,
  onConfirm
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert tone="signal" role="alert" title="Gagal memproses">
            {error}
          </Alert>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={busy} />}>
            {cancelLabel}
          </DialogClose>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'solid'}
            onClick={confirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

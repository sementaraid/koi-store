'use client';

import { CopyValue } from '@/components/cells';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import { wonPaymentInfo, type WonPaymentBank } from '@/lib/helpers/won-payment';

export type PaymentInstructionsProps = {
  finalPrice: number | null;
  payBy: string | null;
  bank: WonPaymentBank | null;
  now: number;
};

// US-108 AC1 (D-068): the winner pays the company account, never the farmer.
// One block for both won-lot views, so the amount, deadline and copy buttons
// can't drift apart.
export function PaymentInstructions({ finalPrice, payBy, bank, now }: PaymentInstructionsProps) {
  const info = wonPaymentInfo({ payBy, bank, now });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          Transfer {finalPrice === null ? 'nominal menang' : formatPrice(finalPrice)} ke rekening
          Koi Auction House
          {payBy ? ` sebelum ${formatDeadline(payBy)} WIB` : ''}.
        </p>
        {finalPrice === null ? null : (
          <CopyValue value={String(finalPrice)} label="nominal" />
        )}
      </div>

      {info.overdue && payBy ? (
        <p role="alert" className="text-sm font-medium text-destructive-ink">
          Batas pembayaran sudah lewat {formatDeadline(payBy)} WIB.
        </p>
      ) : null}

      {info.bank ? (
        <>
          <dl className="grid gap-1.5">
            <BankRow label="Bank" value={info.bank.bank_name} />
            <BankRow label="Nomor rekening" value={info.bank.bank_account_number} mono />
            <BankRow label="Atas nama" value={info.bank.bank_account_holder} />
          </dl>
          <p className="text-xs text-muted-foreground">Transfer tepat sesuai nominal.</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Rekening tujuan belum diatur. Hubungi admin.
        </p>
      )}
    </div>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={mono ? 'font-mono text-sm text-foreground' : 'text-sm text-foreground'}>
          {value}
        </dd>
      </div>
      <CopyValue value={value} label={label.toLowerCase()} />
    </div>
  );
}

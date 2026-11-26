import type { Metadata } from 'next';

import { TopupPage } from '@/components/sections';
import { parseTopupAmount, parseTopupTitle } from '@/lib/helpers/topup-request';

export const metadata: Metadata = {
  title: 'Saldo & top-up'
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ amount?: string | string[]; judul?: string | string[] }>;
}) {
  const { amount, judul } = await searchParams;
  // Prefill only from a positive whole-rupiah integer (US-102 AC2, AC11); anything else is ignored.
  const parsed = typeof amount === 'string' ? parseTopupAmount(amount) : null;
  return (
    <TopupPage
      initialAmount={parsed?.ok ? parsed.amount : undefined}
      initialTitle={parseTopupTitle(judul)}
    />
  );
}

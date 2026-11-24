import { notFound } from 'next/navigation';

import { getPartner } from '@/components/sections';

// Runs above this route's loading.tsx so the status code is 404 for a missing
// partner (notFound() thrown from inside the page arrives after the shell: 200).
export default async function PartnerLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!(await getPartner(handle))) notFound();

  return children;
}

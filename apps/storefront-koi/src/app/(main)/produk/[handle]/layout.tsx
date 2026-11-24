import { notFound } from 'next/navigation';

import { getProduct } from '@/components/sections';

// A layout renders above this route's loading.tsx. Next commits the status code
// when the shell is sent, so the missing-product check has to run here, before
// the shell: notFound() thrown from inside the page arrives too late (200).
export default async function ProductLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!(await getProduct(handle))) notFound();

  return children;
}

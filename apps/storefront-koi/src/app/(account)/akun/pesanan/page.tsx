import { OrdersPage } from '@/components/sections';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  return <OrdersPage page={page} />;
}

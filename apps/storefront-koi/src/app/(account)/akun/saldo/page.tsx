import { WalletPage } from '@/components/sections';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  return <WalletPage page={page} />;
}

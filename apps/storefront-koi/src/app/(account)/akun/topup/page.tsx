import type { Metadata } from 'next';

import { TopupPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Top-up'
};

export default async function Page() {
  return <TopupPage />;
}

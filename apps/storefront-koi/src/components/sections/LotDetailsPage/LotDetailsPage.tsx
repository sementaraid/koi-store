import { getShell } from '@/lib/shell';

import { LotDossier } from './components/LotDossier';

export async function LotDetailsPage({ id }: { id: string }) {
  const { account, cart } = await getShell();

  return <LotDossier id={id} account={account} cart={cart} />;
}

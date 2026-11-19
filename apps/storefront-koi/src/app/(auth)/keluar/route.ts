import { signout } from '@/lib/data/customer';

export async function POST() {
  await signout();
}

import { signout } from '@/lib/data/auth';

export async function POST() {
  await signout();
}

import type { Metadata } from 'next';

import { NotFoundPage } from '@/components/sections/NotFoundPage/NotFoundPage';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  description: 'Alamat yang Anda buka tidak ada di portal ini.'
};

export default NotFoundPage;

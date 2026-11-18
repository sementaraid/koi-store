'use server';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type ReportStatus = 'open';

export type AdminReport = {
  id: string;
  lot_id: string;
  status: ReportStatus;
  reported_at: string;
  pay_by: string | null;
  winner: { id: string; name: string; customer_id: string | null };
  seller: { name: string };
  product: { title: string | null; thumbnail: string | null };
  active_strikes: number;
  banned: boolean;
};

export type ReportList = {
  reports: AdminReport[];
  count: number;
  limit: number;
  offset: number;
};

export const listReports = async (
  status: ReportStatus = 'open',
  limit = 50,
  offset = 0
): Promise<ReportList | null> => {
  await requireAdmin(ROUTES.reports);

  try {
    return (await sdk.admin.reports.query({
      status,
      limit,
      offset,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as unknown as ReportList;
  } catch {
    return null;
  }
};

'use server';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** The report lifecycle (US-058). One value: only the admin leaves `open`, by
 * giving a strike (US-059). */
export type ReportStatus = 'open';

/** One unpaid-winner report in the `/laporan` queue (US-058 T-058.4).
 *
 * @remarks
 * Names only: the backend never selects a phone, an address, an email or a
 * customer id (D-042/D-045/D-052). A report is a record of what the farmer
 * said; it carries nothing about a second bidder (D-026). The deadline is the
 * lot's `closed_at` + 24 h, computed on the server (D-058). */
export type AdminReport = {
  id: string;
  lot_id: string;
  status: ReportStatus;
  reported_at: string;
  /** D-058's payment deadline; null when the lot has no `closed_at`. */
  pay_by: string | null;
  winner: { id: string; name: string; customer_id: string | null };
  seller: { name: string };
  product: { title: string | null; thumbnail: string | null };
  /** The winner's derived ban state (US-059 T-059.1a): the admin sees the
      count before giving a second strike. */
  active_strikes: number;
  banned: boolean;
};

export type ReportList = {
  reports: AdminReport[];
  count: number;
  limit: number;
  offset: number;
};

/* Same client-typing gap as `claims.ts`'s `listClaims`: GET /admin/reports
   validates its query into `validatedQuery`, which the client doesn't derive
   an input type from, so the filter is passed with the same narrow cast. */
/* ponytail: one page of 50, no paging — the cap notice follows the claim and
   farm queues. Add offset paging when the open queue regularly passes 50. */
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

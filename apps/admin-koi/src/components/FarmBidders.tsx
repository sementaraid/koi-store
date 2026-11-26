import Link from 'next/link';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { userHref } from '@/const/routes';
import type { FarmBidder, FarmBidderList } from '@/lib/data/accounts';

import { AdminEmpty } from './AdminEmpty';
import { AdminError } from './AdminError';

// US-071 T-071.2 (AC1–AC3, D-028, D-037): the farmer's bidders, all-time
// counts as the backend returned them. Flagged rows are marked only — no
// button, no ban, no action anywhere on this table. The admin bans by hand on
// the bidder's profile.
export function FarmBidders({ list }: { list: FarmBidderList | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bidder kebun ini</CardTitle>
        <CardDescription>
          Semua bid sepanjang waktu. Baris bertanda perlu ditinjau — tabel ini tidak
          melakukan tindakan apa pun.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {list === null ? (
          <AdminError
            title="Gagal memuat bidder"
            description="Data bidder kebun ini tidak dapat dimuat."
          />
        ) : list.bidders.length === 0 ? (
          <AdminEmpty
            title="Belum ada bidder di kebun ini"
            description="Bidder muncul setelah ada bid pada lot kebun ini."
          />
        ) : (
          <>
            {list.count > list.bidders.length ? (
              <p className="text-sm text-muted-foreground">
                Menampilkan {list.bidders.length} dari {list.count} bidder.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Bidder kebun ini sepanjang waktu: jumlah bid, lot yang dibid, kemenangan
                  dan kemenangan yang belum dibayar.
                </caption>
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Bidder
                    </th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Bid
                    </th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Lot dibid
                    </th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Menang
                    </th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      Belum dibayar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.bidders.map((bidder) => (
                    <BidderRow key={bidder.customer_id} bidder={bidder} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BidderRow({ bidder }: { bidder: FarmBidder }) {
  return (
    <tr className={bidder.flagged ? 'border-t border-border bg-muted/60' : 'border-t border-border'}>
      <td className="py-2 pr-3">
        <div className="grid gap-1">
          <Link href={userHref(bidder.customer_id)} className="font-medium hover:underline">
            {bidder.name || '—'}
          </Link>
          {bidder.flagged ? (
            <div className="flex flex-wrap gap-1">
              <Badge variant="attention">Perlu ditinjau</Badge>
              {bidder.flags.share ? <Badge variant="attention">≥50% bid di kebun ini</Badge> : null}
              {bidder.flags.unpaid ? <Badge variant="attention">≥2 menang belum dibayar</Badge> : null}
            </div>
          ) : null}
        </div>
      </td>
      <td className="py-2 pr-3">{bidder.bid_count}</td>
      <td className="py-2 pr-3">{bidder.lots_bid_on}</td>
      <td className="py-2 pr-3">{bidder.wins}</td>
      <td className="py-2 pr-3">{bidder.unpaid_wins}</td>
    </tr>
  );
}

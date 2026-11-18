import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

/** The live monitoring list while the backend answers. */
export default function LiveAuctionsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Pantau lelang</h1>
        <p className="text-sm text-muted-foreground">Memuat lelang berjalan…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat lelang berjalan</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

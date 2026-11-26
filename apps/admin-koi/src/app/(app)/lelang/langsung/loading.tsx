import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function LiveAuctionsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">Pantau lelang</h1>
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

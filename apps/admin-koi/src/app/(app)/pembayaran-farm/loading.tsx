import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function FarmPayoutsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">Memuat antrean…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat pembayaran ke farm</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

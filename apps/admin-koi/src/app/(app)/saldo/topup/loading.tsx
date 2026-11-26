import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function TopupsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">Permintaan top-up</h1>
        <p className="text-sm text-muted-foreground">Memuat antrean…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat permintaan</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

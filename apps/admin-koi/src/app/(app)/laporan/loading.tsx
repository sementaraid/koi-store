import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function ReportsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">
          Arsip laporan belum dibayar
        </h1>
        <p className="text-sm text-muted-foreground">Memuat arsip…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat arsip laporan</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

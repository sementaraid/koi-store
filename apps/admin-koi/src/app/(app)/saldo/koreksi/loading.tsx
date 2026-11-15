import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

/** The correction screen while the backend answers. */
export default function BalanceCorrectionLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Koreksi saldo</h1>
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat halaman</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

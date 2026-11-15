import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

/** The farm queue while the backend answers. */
export default function FarmsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">Memuat antrean…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat pendaftaran kebun</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

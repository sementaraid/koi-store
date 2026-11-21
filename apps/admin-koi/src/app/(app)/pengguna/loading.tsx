import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function UsersLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">Memuat pengguna…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat daftar pengguna</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

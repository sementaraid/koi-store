import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';

export default function UserLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">Memuat akun…</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Memuat profil pengguna</CardTitle>
          <CardDescription>Menunggu jawaban dari server.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

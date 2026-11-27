// The home route reads eight admin queues before it can render, so it gets the
// layout's loading state. Every other private route has its own.
export default function HomeLoading() {
  return (
    <div className="grid gap-8" aria-busy="true">
      <p className="text-sm text-muted-foreground">Memuat ringkasan antrean…</p>

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="min-h-24 bg-card px-4 py-4">
            <div className="h-3 w-2/3 rounded-sm bg-muted" />
            <div className="mt-6 h-6 w-10 rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

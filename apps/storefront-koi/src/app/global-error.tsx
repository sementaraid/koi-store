'use client';

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: '#fff',
          color: '#111'
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Terjadi kesalahan
          </h1>
          <p style={{ marginTop: '0.75rem', lineHeight: 1.6, color: '#555' }}>
            Halaman ini gagal dimuat. Coba muat ulang — bila masih gagal,
            hubungi admin.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1.5rem',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              border: 0,
              background: '#111',
              color: '#fff',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
  /* The dev server runs behind Caddy at this hostname (see ~/apps/caddy/Caddyfile),
     so requests for its own dev assets arrive with that Origin rather than
     localhost:3002. Without this Next refuses them. The storefront's Vite-based
     siblings spell the same thing `server.allowedHosts`. */
  allowedDevOrigins: ['koi-backoffice.sunar.dev'],
  /* `@koi/ui` is exported as source (see packages/ui/package.json), so Next has
     to compile it with this app rather than treat it as a prebuilt dependency. */
  transpilePackages: ['@koi/ui'],
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  /* No `images.remotePatterns`: the back office shows uploaded evidence — transfer
     screenshots, KTP scans, unboxing video posters — which all come from the
     backend's own file provider. Add that origin here when the first such screen
     lands, rather than opening `**` the way the storefront does for seeded demo
     photos. */
  /* A back office is not indexed and must not be. */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      }
    ];
  }
};

export default nextConfig;

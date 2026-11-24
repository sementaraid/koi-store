import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
  allowedDevOrigins: ['koi-backoffice-dev.sunar.dev'],
  transpilePackages: ['@koi/ui'],
  logging: {
    fetches: {
      fullUrl: true
    }
  },
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

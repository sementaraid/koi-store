import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  reactStrictMode: true,
  allowedDevOrigins: ['koi-dev.sunar.dev'],
  // US-102 AC9: both old wallet pages now live on one page. Config redirects
  // answer 307 before React renders (a page-level redirect inside the account
  // loading boundary streams a 200 instead) and pass `?amount=` through.
  // US-106 AC1 / D-064: the live room is gone, so old links land on the lot page.
  // Permanent because the room will never come back.
  async redirects() {
    return [
      { source: '/akun/saldo', destination: '/akun/saldo-topup', permanent: false },
      { source: '/akun/topup', destination: '/akun/saldo-topup', permanent: false },
      { source: '/lelang/:id/live', destination: '/lelang/:id', permanent: true }
    ];
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  transpilePackages: ['@koi/ui'],
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb'
    }
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'medusa-public-images.s3.eu-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'mercur-connect.s3.eu-central-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'api.mercurjs.com'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      },
      {
        protocol: 'https',
        hostname: 'api-sandbox.mercurjs.com',
        pathname: '/static/**'
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com'
      },
      {
        protocol: 'https',
        hostname: 's3.eu-central-1.amazonaws.com'
      },
      {
        protocol: "https",
        hostname: "mercur-testing.up.railway.app",
      },
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;

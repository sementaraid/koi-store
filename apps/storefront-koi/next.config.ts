import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  /* `@koi/ui` ships as source, so it is compiled as part of this app. */
  transpilePackages: ['@koi/ui'],
  experimental: {
    serverActions: {
      /* A farm registration sends a KTP scan plus up to six farm photos to a
         server action, which goes through one POST — Next's 1 MB default
         refused it. Each file is capped at 5 MB by the form and the upload
         route (`MAX_FARM_FILE_BYTES`); the payload is the seven of them at
         most. A claim's unboxing video (US-054, up to 100 MB) also goes
         through a server action, so the ceiling is above that. */
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

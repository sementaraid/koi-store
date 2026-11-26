import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Resolves where a dashboard app lives:
// - in the source tree (development): ../../apps/<name>
// - in the production build artifact: hosts that deploy only `.medusa/server` (for example
//   Medusa Cloud) get the panels bundled into ./dashboards/<name> by
//   scripts/bundle-dashboards.mjs during `build`. The compiled config runs from the
//   artifact root, so __dirname points there.
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../../apps/${name}`)
}

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: dashboardAppDir('admin'),
        path: '/dashboard',
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: dashboardAppDir('vendor'),
        path: '/seller',
      }
    },
    {
      resolve: './src/modules/wallet',
    },

    {
      resolve: './src/modules/platform-settings',
    },

    // US-030: auctions and lots. Seller, fee category and product are links
    // (src/links/), so the module holds no foreign keys into other modules.
    {
      resolve: './src/modules/auction',
    },

    // US-092 T-092.5 (D-042): append-only log of every full-PII reveal.
    {
      resolve: './src/modules/pii-audit',
    },

    // US-054 (D-038): dead-on-arrival claims on delivered lots.
    {
      resolve: './src/modules/moderation',
    },

    // US-110 (D-069, D-074, D-075, D-078): one payout per paid lot, the
    // winner's arrival proof and the admin's recorded transfer/refund.
    {
      resolve: './src/modules/payout',
    },

    // US-020 (T-020.1). Farm registration data that Mercur's seller has no
    // column for. D-017: the KTP photo key and NIK are private; the farm photos
    // are public and will show on auction pages. The module creates the linked
    // `seller_custom_fields` side table on `medusa db:migrate` (Mercur custom
    // fields doc), so no hand-written migration is added for it.
    {
      resolve: '@mercurjs/core/modules/custom-fields',
      options: {
        customFields: {
          Seller: {
            ktp_photo_key: { type: 'string', nullable: true },
            ktp_nik: { type: 'string', nullable: true },
            farm_photo_urls: { type: 'array', nullable: true },
          },
        },
      },
    },

    // Email over SMTP (Mailpit in dev, compose.yaml). US-002 password reset.
    // Registered only when SMTP_HOST is set, so a backend without mail config
    // still boots; the reset subscriber then logs that it couldn't send.
    ...(process.env.SMTP_HOST ? [{
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: './src/modules/smtp-notification',
            id: 'smtp',
            options: {
              channels: ['email'],
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 1025),
              secure: process.env.SMTP_SECURE === 'true',
              user: process.env.SMTP_USER || undefined,
              pass: process.env.SMTP_PASS || undefined,
              from: process.env.SMTP_FROM,
            },
          },
        ],
      },
    }] : []),

    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              // The local provider bakes this into every uploaded file URL.
              // It must be the publicly reachable origin in production, or
              // images resolve to localhost and render broken.
              backend_url: process.env.FILE_BACKEND_URL || 'http://localhost:9000/static',
              // Private files go OUTSIDE `static`, which is the only directory
              // Medusa serves at /static. Without this the local provider keeps
              // them under static/ and anyone who knows the name can fetch a
              // top-up screenshot (US-011 fix). Still not a private store: use
              // a real private-access provider (e.g. S3) in production.
              private_upload_dir: path.join(process.cwd(), 'private-uploads'),
            },
          },
        ],
      },
    },
  ],
})

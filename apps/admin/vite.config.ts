import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

// createRequire (not a static import): the plugin's ESM build can't dynamic-require
// medusa-config.ts, so it silently falls back to base "/" and 404s panel assets.
const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require('@mercurjs/dashboard-sdk/vite')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Baked into the panel at build time. For a backend-served production build
  // (e.g. Medusa Cloud) set it to the deployed backend origin so API calls are
  // same-origin; it defaults to http://localhost:9000 for development.
  // `loadEnv(..., '')` above takes every key, so the unprefixed name works from
  // both .env and the process environment — no VITE_ duplicate needed.
  const backendUrl = env.MERCUR_BACKEND_URL

  return {
    // Vite rejects requests whose Host header it does not recognise, which is
    // what a reverse proxy in front of the dev server sends. The panel runs
    // behind Caddy at this domain (see ~/apps/caddy/Caddyfile).
    server: {
      allowedHosts: ['koi-backoffice.sunar.dev'],
      // Reachable across the compose bridge, not just the container loopback.
      host: true,
    },
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../../packages/api/medusa-config.ts',
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})

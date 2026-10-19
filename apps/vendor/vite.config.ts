import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// createRequire (not a static import): the plugin's ESM build can't dynamic-require
// medusa-config.ts, so it silently falls back to base "/" and 404s panel assets.
const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require('@mercurjs/dashboard-sdk/vite')

const src = (p = '') => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Baked into the panel at build time. For a backend-served production build
  // (e.g. Medusa Cloud) set it to the deployed backend origin so API calls are
  // same-origin; it defaults to http://localhost:9000 for development.
  const backendUrl = env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../../packages/api/medusa-config.ts',
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
    resolve: {
      // The panel source lives in src/ (forked from @mercurjs/vendor). Keep its path aliases, and
      // point the package name at it so blocks and docs examples importing @mercurjs/vendor work.
      alias: [
        { find: /^@mercurjs\/vendor$/, replacement: src('index.ts') },
        { find: /^@mercurjs\/vendor\/pages$/, replacement: src('pages/index.ts') },
        { find: /^@\//, replacement: src() },
        ...['components', 'hooks', 'lib', 'pages', 'providers', 'assets'].map((dir) => ({
          find: new RegExp(`^@${dir}/`),
          replacement: src(`${dir}/`),
        })),
      ],
    },
  }
})

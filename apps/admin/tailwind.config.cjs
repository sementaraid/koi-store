const path = require("path")

const medusaUI = path.join(
  path.dirname(require.resolve("@medusajs/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

// Locate the installed package (its exports map hides package.json from require.resolve);
// the upstream "../dashboard-shared/src" sibling only exists inside the Mercur monorepo.
const dashboardShared = path.join(
  require.resolve.paths("@mercurjs/dashboard-shared")
    .map((dir) => path.join(dir, "@mercurjs/dashboard-shared"))
    .find((dir) => require("fs").existsSync(dir)),
  "dist/**/*.js"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx}", medusaUI, dashboardShared],
  darkMode: "class",
  theme: {
    extend: {
      transitionTimingFunction: {
        // Strong ease-out; the built-in curves are too weak to read as
        // intentional on the sidebar collapse.
        sidebar: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
}

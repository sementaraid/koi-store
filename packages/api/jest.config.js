const { loadEnv } = require("@medusajs/framework/utils");
// loadEnv never overrides an existing var, and compose.yaml exports the dev
// PII_ENCRYPTION_KEY into the container, so .env.test's key would never apply
// and tests would run against the dev key. Drop it so the test key wins.
if (process.env.PII_ENCRYPTION_KEY) delete process.env.PII_ENCRYPTION_KEY;
loadEnv("test", process.cwd());

// Mercur patches @medusajs/core-flows in memory through a Node require hook on
// import. Jest has its own module registry, so that hook can't work here (it
// re-requires the patch's raw .d.ts files and fails to parse). Mercur ships a
// Jest transformer that applies the same patches at transform time; disable the
// runtime hook under Jest and let the transformer do it instead.
const { PATCHES } = require("@mercurjs/core/patches/manifest");
process.env.MERCUR_DISABLED_PATCHES = PATCHES.map((p) => p.file).join(",");

// The CJS htmlparser2@6 is only reachable through bun's store (it is renderkid's
// nested dep), so look it up there. Fails loudly if a reinstall drops it.
function cjsHtmlparser2() {
  const fs = require("fs");
  const path = require("path");
  const store = path.join(__dirname, "../../node_modules/.bun");
  const dir = fs.readdirSync(store).find((d) => /^htmlparser2@[1-9]\./.test(d));
  if (!dir) {
    throw new Error("jest.config.js: no CJS htmlparser2 (<10) in node_modules/.bun");
  }
  return path.join(store, dir, "node_modules/htmlparser2");
}

module.exports = {
  transform: {
    "@medusajs/core-flows/dist/.+\\.js$": "@mercurjs/core/patches/jest-transformer",
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
        },
        module: { type: "commonjs" },
      },
    ],
  },
  // node_modules stay untransformed except core-flows (patched above).
  // Bun nests packages under node_modules/.bun/<pkg>@<ver>/node_modules/.
  transformIgnorePatterns: [
    "/node_modules/(?!(\\.bun/[^/]+/node_modules/)?@medusajs/core-flows/)",
  ],
  // @mercurjs/core's sanitize-html requires htmlparser2@12, which is ESM-only
  // ("type": "module"). Node 22 can require() it, Jest 29 refuses before any
  // transform runs. Under test only, point it at the CJS htmlparser2@6 already
  // in the lockfile; sanitize-html uses just its `Parser`, which both expose.
  // ponytail: test-only shim; drop when Jest supports require(esm) (Jest 30).
  moduleNameMapper: {
    "^htmlparser2$": cjsHtmlparser2(),
  },
  testEnvironment: "node",
  // Booting a full Medusa app (fresh DB, all migrations) in beforeAll takes longer
  // than Jest's default; spec-level jest.setTimeout still overrides this.
  testTimeout: 300 * 1000,
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
  globalSetup: "./integration-tests/global-setup.js",
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
}

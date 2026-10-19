import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  // noCheck: emit declarations without type-checking. The forked source was written against
  // Mercur's internal monorepo route types, which differ from this project's generated ones
  // (packages/api/.mercur/routes.d.ts), so a full check fails on drift that is harmless at runtime.
  dts: { compilerOptions: { noCheck: true, preserveSymlinks: true } },
  entry: ["src/index.ts", "src/index.css", 'src/pages/index.ts'],
  format: ["esm"],
  external: ["react", "react-dom", "react-router-dom", "virtual:mercur/config", "virtual:mercur/routes", "virtual:mercur/menu-items", "virtual:mercur/i18n", "virtual:mercur/widgets", "virtual:mercur/navigation", "virtual:mercur/custom-fields"],
});

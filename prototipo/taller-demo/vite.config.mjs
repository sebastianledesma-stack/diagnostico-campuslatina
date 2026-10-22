import { defineConfig } from "vite";
export default defineConfig({
  base: "/taller-demo/",
  build: {
    outDir: "dist/taller-demo", emptyOutDir: true, target: "es2022", assetsInlineLimit: 0,
    rollupOptions: { input: "src/taller-demo.js", output: { entryFileNames: "taller-demo.js", format: "es" } },
  },
  worker: { format: "es", rollupOptions: { output: { entryFileNames: "assets/[name]-[hash].js" } } },
});

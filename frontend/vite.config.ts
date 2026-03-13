import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    port: 5173,
    host: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      exclude: [/node_modules\/@zama-fhe\/relayer-sdk/],
    },
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk", "tfhe", "tkms"],
  },
  worker: {
    plugins: () => [wasm(), topLevelAwait()],
  },
});

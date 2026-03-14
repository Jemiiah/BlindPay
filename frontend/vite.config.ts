import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    port: 5173,
    host: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk", "tfhe", "tkms"],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});

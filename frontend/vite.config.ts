import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
    plugins: [
        react(),
        wasm(),
        topLevelAwait(),
    ],
    server: {
        port: 5173,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'credentialless',
        },
    },
    optimizeDeps: {
        exclude: ['@zama-fhe/relayer-sdk', 'tfhe', 'tkms'],
    },
    worker: {
        plugins: () => [wasm(), topLevelAwait()],
    },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tsconfigPaths(),
    tailwindcss(),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
    proxy: {
      "^/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
        rewrite: p => p.replace(/^\/api/, ""), // /api/chat -> /chat
      },
    },
  },
})

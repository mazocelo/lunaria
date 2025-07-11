import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-label", "@radix-ui/react-slot", "@radix-ui/react-toggle", "@radix-ui/react-toggle-group"]
        }
      }
    }
  },
  server: {
    port: process.env.PORT || 3000,
    host: "0.0.0.0"
  }
})

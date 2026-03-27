import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const devProxyTarget =
  process.env.VITE_DEV_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@infra": path.resolve(__dirname, "./src/infrastructure"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@api": path.resolve(__dirname, "./src/infrastructure/api"),
      "@routes": path.resolve(__dirname, "./src/app/router"),
      "@realtime": path.resolve(__dirname, "./src/infrastructure/realtime"),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: devProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: devProxyTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: ["./src/features/admin"],
          clinico: ["./src/features/consultas", "./src/features/expedientes"],
          placeholders: ["./src/shared/components/PlaceholderPage.tsx"],
          auth: ["./src/features/auth"],
          vendors: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
            "zustand",
            "zod",
          ],
        },
      },
    },
  },
});

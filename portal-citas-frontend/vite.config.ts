import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Backend Django corre en :5000 en desarrollo local (ver
// docker-compose.local.yml en la raíz del repo). Se puede sobreescribir con
// VITE_DEV_PROXY_TARGET si el backend corre en otro host/puerto.
const devProxyTarget =
  process.env.VITE_DEV_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/api": {
        target: devProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

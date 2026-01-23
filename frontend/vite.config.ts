import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@routes": path.resolve(__dirname, "./src/routes"),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: ["./src/features/admin"],
          clinico: ["./src/features/consultas", "./src/features/expedientes"],
          placeholders: ["./src/components/shared/PlaceholderPage.tsx"],
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

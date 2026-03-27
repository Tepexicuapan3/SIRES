import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "src/test/e2e/**", "src/test/bun/**"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "src/app/bootstrap/main.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@infra": path.resolve(__dirname, "./src/infrastructure"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@api": path.resolve(__dirname, "./src/infrastructure/api"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@routes": path.resolve(__dirname, "./src/app/router"),
      "@realtime": path.resolve(__dirname, "./src/infrastructure/realtime"),
    },
  },
});

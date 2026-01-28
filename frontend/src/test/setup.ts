import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Iniciar servidor MSW antes de todos los tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Cleanup después de cada test
afterEach(() => {
  cleanup();
  server.resetHandlers(); // Resetear handlers para que no se contaminen entre tests
});

// Cerrar servidor al finalizar
afterAll(() => server.close());

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  // Mock de sessionStorage
  Object.defineProperty(window, "sessionStorage", {
    value: localStorageMock,
  });
}

// Mock de import.meta.env
vi.stubGlobal("import.meta", {
  env: {
    VITE_API_URL: "http://localhost:5000/api/v1",
    VITE_APP_NAME: "SIRES Test",
    VITE_APP_VERSION: "1.0.0-test",
    VITE_USE_MOCKS: "true",
    DEV: true,
    PROD: false,
    MODE: "test",
  },
});

// Mock de window.matchMedia (para dark mode)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Forzar Axios a usar adapter de Node (evita XHR en happy-dom)
if ("XMLHttpRequest" in globalThis) {
  // @ts-expect-error - solo para entorno de test
  globalThis.XMLHttpRequest = undefined;
}

// Mock de IntersectionObserver (para componentes que usan lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock de ResizeObserver (para componentes como ScrollArea)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

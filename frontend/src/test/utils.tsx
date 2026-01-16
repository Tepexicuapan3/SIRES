import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Crear un QueryClient nuevo para cada test
// Esto evita que el estado de un test contamine a otro
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No reintentar en tests para fallar rápido
        gcTime: 0, // Desactivar garbage collection
      },
    },
  });

// Wrapper que provee los contextos necesarios (Query, Router, etc.)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Render personalizado que usa nuestro wrapper
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar todo de testing-library
export * from "@testing-library/react";

// Exportar nuestro render personalizado
export { customRender as render };

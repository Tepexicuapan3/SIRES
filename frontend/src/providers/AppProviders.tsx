import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/config/query-client";
import { ThemeProvider } from "@/providers/ThemeProvider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composición de providers transversales.
 *
 * Razon industria:
 * - Mantiene App.tsx limpio y reduce acoplamiento al entrypoint.
 * - El orden de providers es intencional (Theme -> Query -> UI global).
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/config/query-client";
import { ThemeProvider } from "@/providers/ThemeProvider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composición de todos los providers de la aplicación
 * Mantiene App.tsx limpio y centraliza la configuración
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

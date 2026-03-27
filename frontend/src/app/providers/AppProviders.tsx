import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@shared/ui/sonner";
import { TooltipProvider } from "@shared/ui/tooltip";
import { queryClient } from "@app/config/query-client";
import { ThemeProvider } from "@app/providers/ThemeProvider";

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
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

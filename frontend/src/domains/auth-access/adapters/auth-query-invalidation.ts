import type { QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/domains/auth-access/state/auth.keys";

/**
 * Invalida en conjunto las proyecciones auth para evitar drift
 * entre identidad de sesión y capacidades efectivas.
 */
export const invalidateAuthSessionAndCapabilities = (
  queryClient: QueryClient,
) => {
  void queryClient.invalidateQueries({
    queryKey: authKeys.session(),
    refetchType: "active",
  });

  void queryClient.invalidateQueries({
    queryKey: authKeys.capabilities(),
    refetchType: "active",
  });
};

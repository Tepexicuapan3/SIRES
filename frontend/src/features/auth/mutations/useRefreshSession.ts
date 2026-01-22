import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@api/resources/auth.api";
import { authKeys } from "@features/auth/queries/auth.keys";

/**
 * Mutation para refrescar sesion manualmente.
 *
 * Razon empresarial:
 * - Permite re-hidratar session sin duplicar logica en UI.
 * - Reutiliza la query de sesion como fuente unica de verdad.
 */
export const useRefreshSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAPI.refreshToken(),
    onSuccess: () => {
      // Forza revalidacion de la sesion actual.
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
};

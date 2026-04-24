import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  DeleteCentroAtencionExcepcionResponse,
  CentrosAtencionExcepcionesListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  excepcionId: number;
}

interface MutationContext {
  previousData: [QueryKey, CentrosAtencionExcepcionesListResponse | undefined][];
}

export const useDeleteCentroAtencionExcepcion = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteCentroAtencionExcepcionResponse,
    Error,
    Payload,
    MutationContext
  >({
    mutationFn: ({ excepcionId }) =>
      centrosAtencionAPI.deleteExcepcion(excepcionId),
    onMutate: async ({ excepcionId }) => {
      await queryClient.cancelQueries({
        queryKey: centrosAtencionKeys.exceptions.list(),
      });

      const previousData = queryClient.getQueriesData<CentrosAtencionExcepcionesListResponse>(
        { queryKey: centrosAtencionKeys.exceptions.list() },
      );

      queryClient.setQueriesData<CentrosAtencionExcepcionesListResponse>(
        { queryKey: centrosAtencionKeys.exceptions.list() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((e) => e.id !== excepcionId),
                total: Math.max(0, old.total - 1),
              }
            : old,
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_response, _error, variables) => {
      queryClient.removeQueries({
        queryKey: centrosAtencionKeys.exceptions.detail(variables.excepcionId),
      });
    },
  });
};

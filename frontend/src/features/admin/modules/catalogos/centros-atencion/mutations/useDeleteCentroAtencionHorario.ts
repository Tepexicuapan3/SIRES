import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  DeleteCentroAtencionHorarioResponse,
  CentrosAtencionHorariosListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  scheduleId: number;
}

interface MutationContext {
  previousData: [QueryKey, CentrosAtencionHorariosListResponse | undefined][];
}

export const useDeleteCentroAtencionHorario = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteCentroAtencionHorarioResponse,
    Error,
    Payload,
    MutationContext
  >({
    mutationFn: ({ scheduleId }) =>
      centrosAtencionAPI.deleteSchedule(scheduleId),
    onMutate: async ({ scheduleId }) => {
      await queryClient.cancelQueries({
        queryKey: centrosAtencionKeys.schedules.list(),
      });

      const previousData = queryClient.getQueriesData<CentrosAtencionHorariosListResponse>(
        { queryKey: centrosAtencionKeys.schedules.list() },
      );

      queryClient.setQueriesData<CentrosAtencionHorariosListResponse>(
        { queryKey: centrosAtencionKeys.schedules.list() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((s) => s.id !== scheduleId),
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
        queryKey: centrosAtencionKeys.schedules.detail(variables.scheduleId),
      });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { RecepcionStatusAction } from "@api/types";
import { visitFlowKeys } from "@features/recepcion/shared/queries/visit-flow.keys";

interface VisitStatusActionInput {
  visitId: number;
  targetStatus: RecepcionStatusAction;
}

export const useVisitStatusAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, targetStatus }: VisitStatusActionInput) =>
      visitsAPI.updateStatus(visitId, { targetStatus }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};

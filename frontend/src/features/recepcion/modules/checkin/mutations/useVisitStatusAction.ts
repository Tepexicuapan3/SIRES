import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { RecepcionStatusAction } from "@api/types";
import { visitFlowKeys } from "@features/recepcion/shared/queries/visit-flow.keys";

interface VisitStatusActionInput {
  visitId: number;
  targetStatus: RecepcionStatusAction;
  /** Solo se envia cuando `targetStatus` es "cancelada" -- el backend lo
   * exige para esa transicion (VISIT_MOTIVO_REQUERIDO) e ignora el campo
   * para las demas. */
  motivo?: string;
}

export const useVisitStatusAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, targetStatus, motivo }: VisitStatusActionInput) =>
      visitsAPI.updateStatus(visitId, { targetStatus, motivo }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { CaptureVitalsRequest } from "@api/types";
import { visitFlowKeys } from "@realtime/visits/query-keys";

interface CaptureVitalsInput {
  visitId: number;
  data: CaptureVitalsRequest;
}

export const useCaptureVitals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: CaptureVitalsInput) =>
      visitsAPI.captureVitals(visitId, data),
    // D8 (change `somatometria-modulo-integral`, task 3.6): sin esto
    // react-query reintenta 3 veces por default. Un 409
    // `VITALS_ALREADY_CAPTURED` (o cualquier otro rechazo de negocio) NO
    // se arregla reintentando -- solo repite el mismo rechazo, y en el
    // peor caso confunde a la enfermera sobre cuantos POST se dispararon.
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};

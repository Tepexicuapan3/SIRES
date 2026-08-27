import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { EditVitalsRequest } from "@api/types";
import { visitFlowKeys } from "@realtime/visits/query-keys";

interface EditVitalsInput {
  visitId: number;
  data: EditVitalsRequest;
}

/**
 * Edicion auditada de signos vitales YA capturados (Fase 3, D8, change
 * `somatometria-modulo-integral`). `retry: false` es CRITICO y a
 * proposito (task 3.5): react-query reintenta mutaciones fallidas 3 veces
 * por default, y esta operacion es NO idempotente contra un error de
 * negocio -- un reintento automatico sobre un 404 `VITALS_NOT_FOUND` o un
 * 403 no aporta nada, y sobre un 400/422 de validacion solo repite el
 * mismo rechazo. Sin `retry: false`, un doble-submit accidental por
 * reintento silencioso podria confundir al usuario sobre cuantas veces se
 * disparo el PATCH.
 */
export const useEditVitals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: EditVitalsInput) =>
      visitsAPI.editVitals(visitId, data),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};

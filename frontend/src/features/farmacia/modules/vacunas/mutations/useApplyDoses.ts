import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import { inventarioVacunasKeys } from "../queries/inventario-vacunas.keys";

interface Payload {
  inventarioId: number;
  doses: number;
}

export const useApplyDoses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventarioId, doses }: Payload) =>
      inventarioVacunasAPI.applyDoses(inventarioId, { doses }),
    onSuccess: (_result, { inventarioId }) => {
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.detail(inventarioId) });
    },
  });
};

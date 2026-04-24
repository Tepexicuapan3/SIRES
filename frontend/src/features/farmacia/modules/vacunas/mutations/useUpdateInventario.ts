import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import type { UpdateInventarioVacunaRequest } from "@api/types";
import { inventarioVacunasKeys } from "../queries/inventario-vacunas.keys";

interface Payload {
  inventarioId: number;
  data: UpdateInventarioVacunaRequest;
}

export const useUpdateInventario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventarioId, data }: Payload) => inventarioVacunasAPI.update(inventarioId, data),
    onSuccess: (_result, { inventarioId }) => {
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.detail(inventarioId) });
    },
  });
};

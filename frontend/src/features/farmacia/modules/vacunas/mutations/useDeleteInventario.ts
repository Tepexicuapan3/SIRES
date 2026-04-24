import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import { inventarioVacunasKeys } from "../queries/inventario-vacunas.keys";

export const useDeleteInventario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventarioId }: { inventarioId: number }) => inventarioVacunasAPI.delete(inventarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.lists() });
    },
  });
};

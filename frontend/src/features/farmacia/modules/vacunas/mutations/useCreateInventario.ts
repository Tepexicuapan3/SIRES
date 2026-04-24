import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import type { CreateInventarioVacunaRequest } from "@api/types";
import { inventarioVacunasKeys } from "../queries/inventario-vacunas.keys";

export const useCreateInventario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventarioVacunaRequest) => inventarioVacunasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioVacunasKeys.lists() });
    },
  });
};

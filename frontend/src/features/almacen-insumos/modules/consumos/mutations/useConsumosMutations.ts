import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consumosAPI } from "@api/resources/almacen/kardex.api";
import type { CreateConsumoRequest } from "@api/types";
import { consumosKeys } from "../queries/consumos.keys";
import { kardexKeys } from "../../kardex/queries/kardex.keys";

export function useCreateConsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConsumoRequest) => consumosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consumosKeys.all() });
      void queryClient.invalidateQueries({ queryKey: kardexKeys.all() });
    },
  });
}

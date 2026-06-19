import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salidasAPI } from "@api/resources/almacen/kardex.api";
import type { CreateSalidaRequest } from "@api/types";
import { salidasKeys } from "../queries/salidas.keys";
import { kardexKeys } from "../../kardex/queries/kardex.keys";

export function useCreateSalida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalidaRequest) => salidasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salidasKeys.all() });
      void queryClient.invalidateQueries({ queryKey: kardexKeys.all() });
    },
  });
}

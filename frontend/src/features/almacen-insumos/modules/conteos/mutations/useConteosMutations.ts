import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conteosAPI } from "@api/resources/almacen/kardex.api";
import type { CerrarConteoRequest, CreateConteoRequest } from "@api/types";
import { conteosKeys } from "../queries/conteos.keys";
import { kardexKeys } from "../../kardex/queries/kardex.keys";

export function useCreateConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConteoRequest) => conteosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conteosKeys.all() });
    },
  });
}

export function useCerrarConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CerrarConteoRequest }) =>
      conteosAPI.cerrar(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conteosKeys.all() });
      void queryClient.invalidateQueries({ queryKey: kardexKeys.all() });
    },
  });
}

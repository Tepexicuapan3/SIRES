import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultoriosAPI } from "@api/resources/catalogos/consultorios.api";
import type { CreateConsultorioRequest } from "@api/types";
import { consultoriosKeys } from "@features/admin/modules/catalogos/consultorios/queries/consultorios.keys";

interface CreateConsultorioPayload {
  data: CreateConsultorioRequest;
}

export const useCreateConsultorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateConsultorioPayload) =>
      consultoriosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consultoriosKeys.list() });
    },
  });
};

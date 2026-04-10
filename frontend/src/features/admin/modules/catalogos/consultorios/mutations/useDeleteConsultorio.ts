import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultoriosAPI } from "@api/resources/catalogos/consultorios.api";
import { consultoriosKeys } from "@features/admin/modules/catalogos/consultorios/queries/consultorios.keys";

interface DeleteConsultorioPayload {
  consultorioId: number;
}

export const useDeleteConsultorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultorioId }: DeleteConsultorioPayload) =>
      consultoriosAPI.delete(consultorioId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: consultoriosKeys.list() });
      queryClient.removeQueries({
        queryKey: consultoriosKeys.detail(variables.consultorioId),
      });
    },
  });
};

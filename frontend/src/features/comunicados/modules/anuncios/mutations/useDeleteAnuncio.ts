import { useMutation, useQueryClient } from "@tanstack/react-query";
import { anunciosAPI } from "@api/resources/comunicados/anuncios.api";
import { anunciosKeys } from "@features/comunicados/modules/anuncios/queries/anuncios.keys";

interface Payload {
  id: number;
}

export const useDeleteAnuncio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Payload) => anunciosAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: anunciosKeys.lists() });
      queryClient.removeQueries({
        queryKey: anunciosKeys.detail(variables.id),
      });
    },
  });
};

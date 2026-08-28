import { useMutation, useQueryClient } from "@tanstack/react-query";
import { anunciosAPI } from "@api/resources/comunicados/anuncios.api";
import type {
  AnuncioFormValues,
  UpdateAnuncioResponse,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { anunciosKeys } from "@features/comunicados/modules/anuncios/queries/anuncios.keys";

interface Payload {
  id: number;
  data: Partial<AnuncioFormValues>;
}

export const useUpdateAnuncio = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAnuncioResponse, Error, Payload>({
    mutationFn: ({ id, data }) => anunciosAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(anunciosKeys.detail(variables.id), {
        anuncio: response.anuncio,
      });
      void queryClient.invalidateQueries({ queryKey: anunciosKeys.lists() });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { anunciosAPI } from "@api/resources/comunicados/anuncios.api";
import type {
  AnuncioFormValues,
  CreateAnuncioResponse,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { anunciosKeys } from "@features/comunicados/modules/anuncios/queries/anuncios.keys";

interface Payload {
  data: AnuncioFormValues;
}

export const useCreateAnuncio = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAnuncioResponse, Error, Payload>({
    mutationFn: ({ data }) => anunciosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: anunciosKeys.all });
    },
  });
};

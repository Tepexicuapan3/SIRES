import { useQuery } from "@tanstack/react-query";
import { anunciosAPI } from "@api/resources/comunicados/anuncios.api";
import type { AnuncioDetailResponse } from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { anunciosKeys } from "@features/comunicados/modules/anuncios/queries/anuncios.keys";

export const useAnuncioDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<AnuncioDetailResponse>({
    queryKey: anunciosKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return anunciosAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};

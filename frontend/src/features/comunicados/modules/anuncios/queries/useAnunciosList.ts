import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { anunciosAPI } from "@api/resources/comunicados/anuncios.api";
import type {
  AnunciosListParams,
  AnunciosListResponse,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { anunciosKeys } from "@features/comunicados/modules/anuncios/queries/anuncios.keys";

export const useAnunciosList = (
  params?: AnunciosListParams,
  options?: Pick<UseQueryOptions<AnunciosListResponse>, "enabled">,
) => {
  return useQuery<AnunciosListResponse>({
    queryKey: anunciosKeys.list(params),
    queryFn: () => anunciosAPI.getAll(params),
    enabled: options?.enabled,
    staleTime: 30 * 1000,
  });
};

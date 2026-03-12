import { useQuery } from "@tanstack/react-query";
import { genericCatalogAPI } from "@api/resources/catalogos/generic-catalog.api";
import type {
  GenericCatalogListParams,
  GenericCatalogListResponse,
} from "@api/types/catalogos/generic-catalog.types";

interface UseCatalogListOptions {
  enabled?: boolean;
}

export const useCatalogList = (
  endpoint: string,
  params?: GenericCatalogListParams,
  options: UseCatalogListOptions = {},
) => {
  return useQuery<GenericCatalogListResponse>({
    queryKey: ["admin", "catalogos", endpoint, "list", params],
    queryFn: () => genericCatalogAPI.getAll(endpoint, params),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};

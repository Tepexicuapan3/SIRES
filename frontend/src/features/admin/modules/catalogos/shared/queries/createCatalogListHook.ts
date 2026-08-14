import { useQuery } from "@tanstack/react-query";

interface CatalogKeys<TParams> {
  list: (params?: TParams) => readonly unknown[];
}

interface CreateCatalogListHookConfig<TParams, TResponse> {
  keys: CatalogKeys<TParams>;
  getAll: (params?: TParams) => Promise<TResponse>;
  /** Default 60s -- coincide con el valor que ya usaban todos los catalogos
   * mecanicamente identicos. Pasar un override solo si el catalogo
   * realmente lo necesita (documentarlo en el archivo que llama). */
  staleTime?: number;
}

interface UseCatalogListOptions {
  enabled?: boolean;
}

/**
 * Factory del hook useXxxList() que repetian ~11 catalogos administrativos
 * (mismo useQuery, misma normalizacion de params, mismo enabled). Ver
 * createCatalogKeys.ts para la contraparte de query keys.
 */
export function createCatalogListHook<TParams extends object, TResponse>(
  config: CreateCatalogListHookConfig<TParams, TResponse>,
) {
  const { keys, getAll, staleTime = 60 * 1000 } = config;

  return function useCatalogList(
    params?: TParams,
    options: UseCatalogListOptions = {},
  ) {
    const normalizedParams = params ?? ({} as TParams);

    return useQuery<TResponse>({
      queryKey: keys.list(normalizedParams),
      queryFn: () => getAll(normalizedParams),
      staleTime,
      enabled: options.enabled ?? true,
    });
  };
}

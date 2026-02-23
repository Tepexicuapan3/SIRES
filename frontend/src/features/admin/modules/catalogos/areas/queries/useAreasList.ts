import { useQuery } from "@tanstack/react-query";
import { areasAPI } from "@api/resources/catalogos/areas.api";
import type { AreasListParams, AreasListResponse } from "@api/types";
import { areasKeys } from "@features/admin/modules/catalogos/areas/queries/areas.keys";

interface UseAreasListOptions {
  enabled?: boolean;
}

/**
 * Query de listado de areas.
 *
 * Razon empresarial:
 * - Centraliza paginacion y filtros para reutilizar en tablas CRUD.
 * - Mantiene cache compartida para vistas administrativas.
 */
export const useAreasList = (
  params?: AreasListParams,
  options: UseAreasListOptions = {},
) => {
  return useQuery<AreasListResponse>({
    queryKey: areasKeys.list(params),
    queryFn: () => areasAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};

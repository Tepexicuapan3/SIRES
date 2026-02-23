import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface UseCentrosAtencionListOptions {
  enabled?: boolean;
}

/**
 * Query de listado de centros de atencion.
 *
 * Razon empresarial:
 * - Centraliza filtros y cache para catalogos compartidos.
 * - Reutilizable en formularios y filtros de usuarios.
 */
export const useCentrosAtencionList = (
  params?: CentrosAtencionListParams,
  options: UseCentrosAtencionListOptions = {},
) => {
  return useQuery<CentrosAtencionListResponse>({
    queryKey: centrosAtencionKeys.list(params),
    queryFn: () => centrosAtencionAPI.getAll(params),
    staleTime: 10 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};

import { useQuery } from "@tanstack/react-query";
import { autorizadoresAPI } from "@api/resources/catalogos/autorizadores.api";
import type { AutorizadorDetailResponse } from "@api/types";
import { autorizadoresKeys } from "@features/admin/modules/catalogos/autorizadores/queries/autorizadores.keys";

export const useAutorizadorDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<AutorizadorDetailResponse>({
    queryKey: autorizadoresKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return autorizadoresAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};

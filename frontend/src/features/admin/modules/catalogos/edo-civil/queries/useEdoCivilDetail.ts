import { useQuery } from "@tanstack/react-query";
import { edoCivilAPI } from "@api/resources/catalogos/edoCivil.api";
import type { EdoCivilDetailResponse } from "@api/types";
import { edoCivilKeys } from "@features/admin/modules/catalogos/edo-civil/queries/edoCivil.keys";

export const useEdoCivilDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EdoCivilDetailResponse>({
    queryKey: edoCivilKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return edoCivilAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};

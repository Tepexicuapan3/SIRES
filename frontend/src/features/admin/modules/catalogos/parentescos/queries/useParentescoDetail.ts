import { useQuery } from "@tanstack/react-query";
import { parentescoAPI } from "@api/resources/catalogos/parentesco.api";
import type { ParentescoDetailResponse } from "@api/types";
import { parentescoKeys } from "@features/admin/modules/catalogos/parentescos/queries/parentesco.keys";

export const useParentescoDetail = (id?: string, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<ParentescoDetailResponse>({
    queryKey: parentescoKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return parentescoAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};

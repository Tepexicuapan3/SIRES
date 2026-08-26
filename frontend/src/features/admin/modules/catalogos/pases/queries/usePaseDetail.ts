import { useQuery } from "@tanstack/react-query";
import { pasesAPI } from "@api/resources/catalogos/pases.api";
import type { PaseDetailResponse } from "@api/types";
import { pasesKeys } from "@features/admin/modules/catalogos/pases/queries/pases.keys";

export const usePaseDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<PaseDetailResponse>({
    queryKey: pasesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return pasesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};

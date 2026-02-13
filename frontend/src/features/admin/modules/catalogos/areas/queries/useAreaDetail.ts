import { useQuery } from "@tanstack/react-query";
import { areasAPI } from "@api/resources/catalogos/areas.api";
import type { AreaDetailResponse } from "@api/types";
import { areasKeys } from "@features/admin/modules/catalogos/areas/queries/areas.keys";

export const useAreaDetail = (areaId?: number, enabled = true) => {
  return useQuery<AreaDetailResponse>({
    queryKey: areasKeys.detail(areaId ?? 0),
    queryFn: () => areasAPI.getById(areaId ?? 0),
    enabled: enabled && Boolean(areaId),
    staleTime: 60 * 1000,
  });
};

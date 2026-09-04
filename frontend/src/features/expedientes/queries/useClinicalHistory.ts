import { useQuery } from "@tanstack/react-query";
import { clinicalHistoryAPI } from "@api/resources/clinical-history.api";

export const clinicalHistoryKeys = {
  detail: (noExp: string, pkNum: number) =>
    ["expedientes", "clinical-history", noExp, pkNum] as const,
};

export const useClinicalHistory = (noExp: string, pkNum = 0) => {
  return useQuery({
    queryKey: clinicalHistoryKeys.detail(noExp, pkNum),
    queryFn: () => clinicalHistoryAPI.get(noExp, pkNum),
    enabled: Boolean(noExp),
    staleTime: 60 * 1000,
  });
};

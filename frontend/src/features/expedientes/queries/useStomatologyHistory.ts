import { useQuery } from "@tanstack/react-query";
import { stomatologyHistoryAPI } from "@api/resources/stomatology-history.api";

export const stomatologyHistoryKeys = {
  detail: (noExp: string, pkNum: number) =>
    ["expedientes", "stomatology-history", noExp, pkNum] as const,
};

export const useStomatologyHistory = (noExp: string, pkNum = 0) => {
  return useQuery({
    queryKey: stomatologyHistoryKeys.detail(noExp, pkNum),
    queryFn: () => stomatologyHistoryAPI.get(noExp, pkNum),
    enabled: Boolean(noExp),
    staleTime: 60 * 1000,
  });
};

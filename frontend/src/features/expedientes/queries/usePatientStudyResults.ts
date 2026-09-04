import { useQuery } from "@tanstack/react-query";
import { studyResultAPI } from "@api/resources/study-result.api";

export const usePatientStudyResults = (noExp: string, pkNum = 0) => {
  return useQuery({
    queryKey: ["expedientes", "study-results", noExp, pkNum],
    queryFn: () => studyResultAPI.getPatientHistory(noExp, pkNum),
    enabled: Boolean(noExp),
    staleTime: 60 * 1000,
  });
};

import { useQuery } from "@tanstack/react-query";
import { medicalLeaveAPI } from "@api/resources/medical-leave.api";

export const usePatientMedicalLeaves = (noExp: string, pkNum = 0) => {
  return useQuery({
    queryKey: ["expedientes", "medical-leaves", noExp, pkNum],
    queryFn: () => medicalLeaveAPI.getPatientHistory(noExp, pkNum),
    enabled: Boolean(noExp),
    staleTime: 60 * 1000,
  });
};

import { useQuery } from "@tanstack/react-query";
import { patientConsultationsAPI } from "@api/resources/patient-consultations.api";

export const usePatientConsultationsHistory = (noExp: string, pkNum = 0) => {
  return useQuery({
    queryKey: ["expedientes", "consultations-history", noExp, pkNum],
    queryFn: () => patientConsultationsAPI.getHistory(noExp, pkNum),
    enabled: Boolean(noExp),
    staleTime: 60 * 1000,
  });
};

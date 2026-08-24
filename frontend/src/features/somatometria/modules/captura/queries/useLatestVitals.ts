import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

const LATEST_VITALS_KEY = "latest-vitals";

/** Ultima captura de vitales del paciente de la visita dada -- para
 * precargar el formulario de somatometria. No confundir con el historial
 * clinico (`VisitVitalSigns`, una fila por visita): esto es solo el
 * espejo "ultimo valor conocido" que vive en `PatientLatestVitals`. */
export const useLatestVitals = (visitId: number | null, enabled = true) =>
  useQuery({
    queryKey: [LATEST_VITALS_KEY, visitId],
    queryFn: () => visitsAPI.getLatestVitals(visitId as number),
    enabled: enabled && visitId !== null,
    staleTime: 30_000,
    retry: false,
  });

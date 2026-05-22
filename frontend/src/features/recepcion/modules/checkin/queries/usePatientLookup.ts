import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

const PATIENT_LOOKUP_KEY = "patient-lookup";

/** Busca titular y derechohabientes por expediente (solo activos). */
export const usePatientLookup = (noExp: string) =>
  useQuery({
    queryKey:  [PATIENT_LOOKUP_KEY, noExp],
    queryFn:   () => visitsAPI.patientLookup(noExp),
    enabled:   noExp.trim().length > 0,
    staleTime: 30_000,
    retry:     false,
  });

/** Versión histórica: incluye pacientes de baja — usada en fichas y registros. */
export const usePatientLookupHistorico = (noExp: string, enabled = true) =>
  useQuery({
    queryKey:  [PATIENT_LOOKUP_KEY, noExp, "historico"],
    queryFn:   () => visitsAPI.patientLookup(noExp, true),
    enabled:   enabled && noExp.trim().length > 0,
    staleTime: 60_000,
    retry:     false,
  });

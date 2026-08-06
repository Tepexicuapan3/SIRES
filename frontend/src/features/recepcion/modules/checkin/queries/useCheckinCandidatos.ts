import { useQuery } from "@tanstack/react-query";
import { checkinAPI } from "@api/resources/checkin.api";
import type { CheckinCandidatosParams } from "@api/types";

const CHECKIN_CANDIDATOS_KEY = "checkin-candidatos";

/**
 * Busca citas de hoy pendientes de check-in por nombre o folio
 * (`GET /citas/checkin/candidatos`). `params` es `null` mientras el usuario
 * no escribió un criterio válido (ver `resolveCheckinSearchParams`) — la
 * query queda deshabilitada en ese caso, sin pegarle al backend con el
 * campo vacío o con muy pocos caracteres.
 */
export const useCheckinCandidatos = (params: CheckinCandidatosParams | null) =>
  useQuery({
    queryKey: [CHECKIN_CANDIDATOS_KEY, params],
    queryFn: () => checkinAPI.buscarCandidatos(params as CheckinCandidatosParams),
    enabled: params !== null,
    staleTime: 5_000,
    retry: false,
  });

import {
  VISIT_STATUS,
  type VisitQueueItem,
  type VisitsListResponse,
} from "@api/types";
import { SOCKET_CONNECTION_STATUS } from "@realtime/visits/client";
import { useVisitQueueByStatus } from "@realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@realtime/visits/useVisitRealtimeSync";

interface UseDoctorPipelineQueueOptions {
  enabled?: boolean;
}

/**
 * Bandeja operativa completa para el medico: TODAS las visitas en proceso
 * (en_espera, en_somatometria, lista_para_doctor, en_consulta), sin filtrar
 * por medico asignado -- decision explicita del usuario, dado que muchos
 * walk-ins todavia no tienen `doctorId` en las etapas tempranas (recien se
 * les asigna medico al llegar a `lista_para_doctor`). Es una bandeja
 * compartida, igual criterio que ya usa `useDoctorQueue` para
 * lista_para_doctor/en_consulta -- esta la extiende con las 2 etapas
 * previas para que el medico vea el pipeline completo, no solo su cola de
 * atencion.
 */
export const useDoctorPipelineQueue = (
  options: UseDoctorPipelineQueueOptions = {},
) => {
  const enabled = options.enabled ?? true;

  const realtime = useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 50,
    },
  });

  const shouldUsePollingFallback =
    enabled &&
    import.meta.env.MODE !== "test" &&
    (realtime.connectionStatus === SOCKET_CONNECTION_STATUS.DISCONNECTED ||
      realtime.connectionStatus === SOCKET_CONNECTION_STATUS.ERROR);

  const queryOptions = {
    enabled,
    pageSize: 50,
    refetchIntervalMs: shouldUsePollingFallback ? 3_000 : undefined,
  };

  const esperaQuery = useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, queryOptions);
  const somatometriaQuery = useVisitQueueByStatus(
    VISIT_STATUS.EN_SOMATOMETRIA,
    queryOptions,
  );
  const listaParaDoctorQuery = useVisitQueueByStatus(
    VISIT_STATUS.LISTA_PARA_DOCTOR,
    queryOptions,
  );
  const enConsultaQuery = useVisitQueueByStatus(
    VISIT_STATUS.EN_CONSULTA,
    queryOptions,
  );

  const buckets = [
    esperaQuery,
    somatometriaQuery,
    listaParaDoctorQuery,
    enConsultaQuery,
  ];

  const mergedItems: VisitQueueItem[] = (() => {
    const seen = new Set<number>();
    const merged: VisitQueueItem[] = [];

    for (const bucket of buckets) {
      const items = [...(bucket.data?.items ?? [])].sort(
        (left, right) => left.id - right.id,
      );
      for (const visit of items) {
        if (seen.has(visit.id)) continue;
        seen.add(visit.id);
        merged.push(visit);
      }
    }

    return merged;
  })();

  const anyDataLoaded = buckets.some((bucket) => bucket.data !== undefined);

  const mergedData: VisitsListResponse | undefined = anyDataLoaded
    ? {
        items: mergedItems,
        page: 1,
        pageSize: mergedItems.length,
        total: buckets.reduce((sum, bucket) => sum + (bucket.data?.total ?? 0), 0),
        totalPages: Math.max(
          ...buckets.map((bucket) => bucket.data?.totalPages ?? 0),
        ),
      }
    : undefined;

  return {
    data: mergedData,
    isLoading: buckets.some((bucket) => bucket.isLoading),
    isFetching: buckets.some((bucket) => bucket.isFetching),
    isError: buckets.some((bucket) => bucket.isError),
    error: buckets.find((bucket) => bucket.error)?.error ?? null,
    connectionStatus: realtime.connectionStatus,
    refetch: async () => {
      await Promise.all(buckets.map((bucket) => bucket.refetch()));
    },
  };
};

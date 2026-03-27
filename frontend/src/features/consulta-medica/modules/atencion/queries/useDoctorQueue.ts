import {
  VISIT_STATUS,
  type VisitQueueItem,
  type VisitsListResponse,
} from "@api/types";
import { SOCKET_CONNECTION_STATUS } from "@realtime/visits/client";
import { useVisitQueueByStatus } from "@realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@realtime/visits/useVisitRealtimeSync";

interface UseDoctorQueueOptions {
  enabled?: boolean;
}

export const useDoctorQueue = (options: UseDoctorQueueOptions = {}) => {
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
    ...options,
    pageSize: 50,
    refetchIntervalMs: shouldUsePollingFallback ? 3_000 : undefined,
  };

  const readyQueueQuery = useVisitQueueByStatus(
    VISIT_STATUS.LISTA_PARA_DOCTOR,
    queryOptions,
  );
  const activeQueueQuery = useVisitQueueByStatus(
    VISIT_STATUS.EN_CONSULTA,
    queryOptions,
  );

  const mergeStableQueue = (
    firstBucket: VisitQueueItem[],
    secondBucket: VisitQueueItem[],
  ): VisitQueueItem[] => {
    const sortBucket = (bucket: VisitQueueItem[]): VisitQueueItem[] => {
      return [...bucket].sort((left, right) => left.id - right.id);
    };

    const merged = [...sortBucket(firstBucket), ...sortBucket(secondBucket)];
    const seen = new Set<number>();
    const deduped = merged.filter((visit) => {
      if (seen.has(visit.id)) {
        return false;
      }

      seen.add(visit.id);
      return true;
    });

    return deduped;
  };

  const readyData = readyQueueQuery.data;
  const activeData = activeQueueQuery.data;

  const mergedItems = mergeStableQueue(
    readyData?.items ?? [],
    activeData?.items ?? [],
  );

  const mergedData: VisitsListResponse | undefined =
    readyData || activeData
      ? {
          items: mergedItems,
          page: 1,
          pageSize: mergedItems.length,
          total: (readyData?.total ?? 0) + (activeData?.total ?? 0),
          totalPages: Math.max(
            readyData?.totalPages ?? 0,
            activeData?.totalPages ?? 0,
          ),
        }
      : undefined;

  return {
    ...readyQueueQuery,
    data: mergedData,
    isLoading: readyQueueQuery.isLoading || activeQueueQuery.isLoading,
    isFetching: readyQueueQuery.isFetching || activeQueueQuery.isFetching,
    isError: readyQueueQuery.isError || activeQueueQuery.isError,
    error: readyQueueQuery.error ?? activeQueueQuery.error,
    connectionStatus: realtime.connectionStatus,
    lastSequence: realtime.lastSequence,
    refetch: async () => {
      const [result] = await Promise.all([
        readyQueueQuery.refetch(),
        activeQueueQuery.refetch(),
      ]);
      return result;
    },
  };
};

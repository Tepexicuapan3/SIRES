import type { QueryClient } from "@tanstack/react-query";

import { visitsAPI } from "@api/resources/visits.api";
import type { VisitsListParams } from "@api/types";
import { visitFlowKeys } from "@features/flujo-clinico/queries/visit-flow.keys";
import type { RealtimeSequenceGap } from "@/realtime/client";
import type { RealtimeEventEnvelope } from "@/realtime/protocol";
import type { RealtimeFeatureSubscriptions } from "@/realtime/subscriptions";

export const VISITS_REALTIME_ADAPTER = {
  FEATURE: "flujo-clinico",
} as const;

export const VISITS_REALTIME_EVENT_TYPE = {
  VISIT_STATUS_CHANGED: "visit.status.changed",
  VISIT_CLOSED: "visit.closed",
} as const;

export type VisitsRealtimeEventType =
  (typeof VISITS_REALTIME_EVENT_TYPE)[keyof typeof VISITS_REALTIME_EVENT_TYPE];

interface CreateVisitsRealtimeAdapterOptions {
  queryClient: QueryClient;
  resyncParams?: VisitsListParams;
}

export interface VisitsRealtimeAdapter {
  subscriptions: RealtimeFeatureSubscriptions;
  handleEvent: (event: RealtimeEventEnvelope) => Promise<void>;
  handleGap: (gap: RealtimeSequenceGap) => Promise<void>;
  resync: () => Promise<void>;
}

export const createVisitsRealtimeAdapter = (
  options: CreateVisitsRealtimeAdapterOptions,
): VisitsRealtimeAdapter => {
  const { queryClient, resyncParams } = options;

  const invalidateFlow = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
  };

  const resync = async (): Promise<void> => {
    await visitsAPI.getAll(resyncParams);
    await invalidateFlow();
  };

  const handleEvent = async (event: RealtimeEventEnvelope): Promise<void> => {
    if (event.entity !== "visit") {
      return;
    }

    if (
      event.eventType === VISITS_REALTIME_EVENT_TYPE.VISIT_STATUS_CHANGED ||
      event.eventType === VISITS_REALTIME_EVENT_TYPE.VISIT_CLOSED
    ) {
      await invalidateFlow();
    }
  };

  const subscriptions: RealtimeFeatureSubscriptions = {
    feature: VISITS_REALTIME_ADAPTER.FEATURE,
    eventHandlers: {
      [VISITS_REALTIME_EVENT_TYPE.VISIT_STATUS_CHANGED]: (event) => {
        void handleEvent(event);
      },
      [VISITS_REALTIME_EVENT_TYPE.VISIT_CLOSED]: (event) => {
        void handleEvent(event);
      },
    },
  };

  const handleGap = async (): Promise<void> => {
    await resync();
  };

  return {
    subscriptions,
    handleEvent,
    handleGap,
    resync,
  };
};

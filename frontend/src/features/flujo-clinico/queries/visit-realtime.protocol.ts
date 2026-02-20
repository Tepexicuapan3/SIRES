import {
  isRealtimeEventEnvelope,
  parseRealtimeEnvelope,
  type RealtimeEventEnvelope,
} from "@/realtime/protocol";

export const VISIT_REALTIME_ENTITY = {
  VISIT: "visit",
} as const;

export type VisitRealtimeEntity =
  (typeof VISIT_REALTIME_ENTITY)[keyof typeof VISIT_REALTIME_ENTITY];

export const VISIT_REALTIME_EVENT_TYPE = {
  VISIT_STATUS_CHANGED: "visit.status.changed",
  VISIT_CLOSED: "visit.closed",
} as const;

export type VisitRealtimeEventType =
  (typeof VISIT_REALTIME_EVENT_TYPE)[keyof typeof VISIT_REALTIME_EVENT_TYPE];

export type VisitRealtimeEventEnvelope = RealtimeEventEnvelope;

export const isVisitRealtimeEventEnvelope = isRealtimeEventEnvelope;
export const parseVisitRealtimeEnvelope = parseRealtimeEnvelope;

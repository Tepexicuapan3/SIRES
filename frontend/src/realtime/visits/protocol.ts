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
  VISIT_CREATED: "visit.created",
  VISIT_STATUS_CHANGED: "visit.status.changed",
  VISIT_CANCELLED: "visit.cancelled",
  VISIT_NO_SHOW: "visit.no_show",
  VISIT_CLOSED: "visit.closed",
} as const;

export type VisitRealtimeEventType =
  (typeof VISIT_REALTIME_EVENT_TYPE)[keyof typeof VISIT_REALTIME_EVENT_TYPE];

export type VisitRealtimeEventEnvelope = RealtimeEventEnvelope;

export const isVisitRealtimeEventEnvelope = isRealtimeEventEnvelope;
export const parseVisitRealtimeEnvelope = parseRealtimeEnvelope;

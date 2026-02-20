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

export interface VisitRealtimeEventEnvelope {
  eventId: string;
  eventType: VisitRealtimeEventType;
  entity: VisitRealtimeEntity;
  entityId: string;
  version: number;
  occurredAt: string;
  requestId: string;
  correlationId: string;
  sequence: number;
  payload: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const hasString = (record: Record<string, unknown>, key: string): boolean => {
  return typeof record[key] === "string";
};

const hasNumber = (record: Record<string, unknown>, key: string): boolean => {
  return typeof record[key] === "number";
};

export const isVisitRealtimeEventEnvelope = (
  value: unknown,
): value is VisitRealtimeEventEnvelope => {
  if (!isRecord(value)) {
    return false;
  }

  const eventType = value.eventType;
  const entity = value.entity;

  if (
    eventType !== VISIT_REALTIME_EVENT_TYPE.VISIT_STATUS_CHANGED &&
    eventType !== VISIT_REALTIME_EVENT_TYPE.VISIT_CLOSED
  ) {
    return false;
  }

  if (entity !== VISIT_REALTIME_ENTITY.VISIT) {
    return false;
  }

  return (
    hasString(value, "eventId") &&
    hasString(value, "entityId") &&
    hasNumber(value, "version") &&
    hasString(value, "occurredAt") &&
    hasString(value, "requestId") &&
    hasString(value, "correlationId") &&
    hasNumber(value, "sequence") &&
    isRecord(value.payload)
  );
};

export const parseVisitRealtimeEnvelope = (
  data: string,
): VisitRealtimeEventEnvelope | null => {
  try {
    const parsed: unknown = JSON.parse(data);
    return isVisitRealtimeEventEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

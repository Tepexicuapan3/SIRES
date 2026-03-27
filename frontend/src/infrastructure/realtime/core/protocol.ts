export const REALTIME_ENVELOPE = {
  VERSION: 1,
} as const;

export type RealtimeEnvelopeVersion = typeof REALTIME_ENVELOPE.VERSION;

export interface RealtimeEventEnvelope {
  eventId: string;
  eventType: string;
  entity: string;
  entityId: string;
  version: RealtimeEnvelopeVersion;
  occurredAt: string;
  requestId: string;
  correlationId: string;
  sequence: number;
  payload: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

export const isRealtimeEventEnvelope = (
  value: unknown,
): value is RealtimeEventEnvelope => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.eventId) &&
    isNonEmptyString(value.eventType) &&
    isNonEmptyString(value.entity) &&
    isNonEmptyString(value.entityId) &&
    value.version === REALTIME_ENVELOPE.VERSION &&
    isNonEmptyString(value.occurredAt) &&
    isNonEmptyString(value.requestId) &&
    isNonEmptyString(value.correlationId) &&
    isPositiveInteger(value.sequence) &&
    isRecord(value.payload)
  );
};

export const parseRealtimeEnvelope = (
  payload: string,
): RealtimeEventEnvelope | null => {
  try {
    const parsed: unknown = JSON.parse(payload);
    return isRealtimeEventEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

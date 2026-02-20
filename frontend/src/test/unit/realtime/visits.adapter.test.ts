import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { visitsAPI } from "@api/resources/visits.api";
import { VISIT_STATUS } from "@api/types";
import { visitFlowKeys } from "@features/flujo-clinico/queries/visit-flow.keys";
import { createVisitsRealtimeAdapter } from "@/realtime/adapters/visits";
import type { RealtimeEventEnvelope } from "@/realtime/protocol";

const buildEvent = (
  eventType: string,
  sequence: number,
): RealtimeEventEnvelope => ({
  eventId: `evt-${sequence}`,
  eventType,
  entity: "visit",
  entityId: "VIS-9001",
  version: 1,
  occurredAt: "2026-02-19T14:00:00Z",
  requestId: "req-9001",
  correlationId: "corr-9001",
  sequence,
  payload: { status: "en_consulta" },
});

const createListResponse = () => ({
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

describe("createVisitsRealtimeAdapter", () => {
  it("eventos relevantes invalidan query keys de flujo clinico", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const adapter = createVisitsRealtimeAdapter({ queryClient });

    await adapter.handleEvent(buildEvent("visit.status.changed", 10));
    await adapter.handleEvent(buildEvent("visit.closed", 11));

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: visitFlowKeys.lists(),
    });
  });

  it("gap detection dispara resync esperado por API", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const getAllSpy = vi
      .spyOn(visitsAPI, "getAll")
      .mockResolvedValue(createListResponse());

    const adapter = createVisitsRealtimeAdapter({
      queryClient,
      resyncParams: {
        page: 1,
        pageSize: 20,
        status: VISIT_STATUS.EN_ESPERA,
      },
    });

    await adapter.handleGap({ expectedSequence: 21, receivedSequence: 25 });

    expect(getAllSpy).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: VISIT_STATUS.EN_ESPERA,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: visitFlowKeys.lists(),
    });
  });

  it("eventos desconocidos no rompen el flujo", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const adapter = createVisitsRealtimeAdapter({ queryClient });

    await expect(
      adapter.handleEvent(buildEvent("visit.unknown", 99)),
    ).resolves.toBeUndefined();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

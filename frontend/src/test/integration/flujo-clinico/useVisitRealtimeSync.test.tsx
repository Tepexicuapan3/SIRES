import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@/test/utils";
import { TestProviders } from "@/test/providers";
import { visitsAPI } from "@api/resources/visits.api";
import { VISIT_STATUS } from "@api/types";
import {
  SOCKET_CONNECTION_STATUS,
  type WebSocketLike,
} from "@/realtime/visits/client";
import type { VisitRealtimeEventEnvelope } from "@/realtime/visits/protocol";
import { useVisitRealtimeSync } from "@/realtime/visits/useVisitRealtimeSync";

class FakeWebSocket implements WebSocketLike {
  url: string;
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  close(): void {
    this.readyState = 3;
  }

  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  serverMessage(payload: VisitRealtimeEventEnvelope): void {
    this.onmessage?.({
      data: JSON.stringify(payload),
    } as MessageEvent<string>);
  }

  serverError(): void {
    this.onerror?.(new Event("error"));
  }

  serverClose(code = 1006, reason = "network"): void {
    this.readyState = 3;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

const buildEnvelope = (
  sequence: number,
  eventId = `evt-${sequence}`,
): VisitRealtimeEventEnvelope => ({
  eventId,
  eventType: "visit.status.changed",
  entity: "visit",
  entityId: "VIS-2001",
  version: 1,
  occurredAt: "2026-02-19T11:00:00Z",
  requestId: "req-2001",
  correlationId: "corr-2001",
  sequence,
  payload: { status: "en_somatometria" },
});

describe("useVisitRealtimeSync", () => {
  const createListResponse = () => ({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  it("detecta gap y dispara resync por API", async () => {
    const getAllSpy = vi
      .spyOn(visitsAPI, "getAll")
      .mockResolvedValue(createListResponse());

    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");

    renderHook(
      () =>
        useVisitRealtimeSync({
          enabled: true,
          resyncParams: {
            page: 1,
            pageSize: 20,
            status: VISIT_STATUS.EN_ESPERA,
          },
          socketFactory: () => socket,
          random: () => 0,
          jitterRatio: 0,
        }),
      { wrapper: TestProviders },
    );

    act(() => {
      socket.open();
      socket.serverMessage(buildEnvelope(500));
      socket.serverMessage(buildEnvelope(502));
    });

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: VISIT_STATUS.EN_ESPERA,
      });
    });
  });

  it("maneja error y cierre de socket sin romper estado del hook", async () => {
    vi.spyOn(visitsAPI, "getAll").mockResolvedValue(createListResponse());

    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");

    const { result } = renderHook(
      () =>
        useVisitRealtimeSync({
          enabled: true,
          socketFactory: () => socket,
          random: () => 0,
          jitterRatio: 0,
          backoffBaseMs: 10,
          backoffMaxMs: 20,
        }),
      { wrapper: TestProviders },
    );

    act(() => {
      socket.open();
    });
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe(
        SOCKET_CONNECTION_STATUS.CONNECTED,
      );
    });

    act(() => {
      socket.serverError();
    });
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe(
        SOCKET_CONNECTION_STATUS.ERROR,
      );
    });

    act(() => {
      socket.serverClose(1006, "network");
    });
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe(
        SOCKET_CONNECTION_STATUS.DISCONNECTED,
      );
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SOCKET_CONNECTION_STATUS,
  VisitRealtimeClient,
  type WebSocketLike,
} from "@realtime/visits/client";
import type { VisitRealtimeEventEnvelope } from "@realtime/visits/protocol";

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

  serverClose(code = 1006, reason = "network"): void {
    this.readyState = 3;
    this.onclose?.({ code, reason } as CloseEvent);
  }

  serverError(): void {
    this.onerror?.(new Event("error"));
  }
}

const buildEnvelope = (
  sequence: number,
  overrides: Partial<VisitRealtimeEventEnvelope> = {},
): VisitRealtimeEventEnvelope => ({
  eventId: `evt-${sequence}`,
  eventType: "visit.status.changed",
  entity: "visit",
  entityId: "VIS-1001",
  version: 1,
  occurredAt: "2026-02-19T10:00:00Z",
  requestId: "req-1001",
  correlationId: "corr-1001",
  sequence,
  payload: { status: "en_somatometria" },
  ...overrides,
});

describe("VisitRealtimeClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("reconecta con backoff determinista cuando se corta el socket", () => {
    const sockets: FakeWebSocket[] = [];
    const client = new VisitRealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket;
      },
      random: () => 0,
      backoffBaseMs: 1000,
      backoffMaxMs: 8000,
      jitterRatio: 0,
    });

    client.connect();
    expect(sockets).toHaveLength(1);
    sockets[0].open();

    expect(client.getState().connectionStatus).toBe(
      SOCKET_CONNECTION_STATUS.CONNECTED,
    );

    sockets[0].serverClose(1012, "restart");
    expect(client.getState().connectionStatus).toBe(
      SOCKET_CONNECTION_STATUS.DISCONNECTED,
    );

    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
  });

  it("dedupe por eventId", () => {
    const onEvent = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new VisitRealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      onEvent,
      random: () => 0,
    });

    client.connect();
    socket.open();

    const duplicateEvent = buildEnvelope(10, { eventId: "evt-dup" });
    socket.serverMessage(duplicateEvent);
    socket.serverMessage(duplicateEvent);

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(client.getState().lastSequence).toBe(10);
  });

  it("aplica ordering por sequence y descarta out-of-order", () => {
    const onEvent = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new VisitRealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      onEvent,
      random: () => 0,
    });

    client.connect();
    socket.open();

    socket.serverMessage(buildEnvelope(20));
    socket.serverMessage(buildEnvelope(21));
    socket.serverMessage(buildEnvelope(19));

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(client.getState().lastSequence).toBe(21);
  });

  it("detecta gap y dispara resync", () => {
    const onGapDetected = vi.fn();
    const onResyncRequested = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new VisitRealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      onGapDetected,
      onResyncRequested,
      random: () => 0,
    });

    client.connect();
    socket.open();

    socket.serverMessage(buildEnvelope(100));
    socket.serverMessage(buildEnvelope(102));

    expect(onGapDetected).toHaveBeenCalledWith({
      expectedSequence: 101,
      receivedSequence: 102,
    });
    expect(onResyncRequested).toHaveBeenCalledTimes(1);
  });

  it("maneja onerror/onclose sin romper estado expuesto", () => {
    const onSocketError = vi.fn();
    const onSocketClosed = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new VisitRealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      onSocketError,
      onSocketClosed,
      random: () => 0,
      jitterRatio: 0,
    });

    client.connect();
    socket.open();
    socket.serverError();

    expect(onSocketError).toHaveBeenCalledTimes(1);
    expect(client.getState().connectionStatus).toBe(
      SOCKET_CONNECTION_STATUS.ERROR,
    );

    socket.serverClose(1006, "network");
    expect(onSocketClosed).toHaveBeenCalledWith({
      code: 1006,
      reason: "network",
    });
  });
});

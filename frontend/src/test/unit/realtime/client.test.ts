import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REALTIME_CONNECTION_STATUS,
  RealtimeClient,
  type RealtimeWebSocketLike,
} from "@/realtime/client";
import type { RealtimeEventEnvelope } from "@/realtime/protocol";

class FakeWebSocket implements RealtimeWebSocketLike {
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

  send(): void {}

  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  serverMessage(payload: RealtimeEventEnvelope): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }

  serverClose(code = 1006, reason = "network"): void {
    this.readyState = 3;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

const buildEnvelope = (
  sequence: number,
  overrides: Partial<RealtimeEventEnvelope> = {},
): RealtimeEventEnvelope => ({
  eventId: `evt-${sequence}`,
  eventType: "visit.status.changed",
  entity: "visit",
  entityId: "VIS-3001",
  version: 1,
  occurredAt: "2026-02-19T12:00:00Z",
  requestId: "req-3001",
  correlationId: "corr-3001",
  sequence,
  payload: { status: "en_somatometria" },
  ...overrides,
});

describe("RealtimeClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maneja lifecycle basico de conexion", () => {
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const statusChanges: string[] = [];
    const client = new RealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      random: () => 0,
    });

    const offState = client.onStateChange((state) => {
      statusChanges.push(state.connectionStatus);
    });

    client.connect();
    expect(client.getState().connectionStatus).toBe(
      REALTIME_CONNECTION_STATUS.CONNECTING,
    );

    socket.open();
    expect(client.getState().connectionStatus).toBe(
      REALTIME_CONNECTION_STATUS.CONNECTED,
    );

    client.disconnect();
    expect(client.getState().connectionStatus).toBe(
      REALTIME_CONNECTION_STATUS.DISCONNECTED,
    );

    offState();
    expect(statusChanges).toEqual([
      REALTIME_CONNECTION_STATUS.CONNECTING,
      REALTIME_CONNECTION_STATUS.CONNECTED,
      REALTIME_CONNECTION_STATUS.DISCONNECTED,
    ]);
  });

  it("reconecta con backoff exponencial determinista", () => {
    const sockets: FakeWebSocket[] = [];
    const client = new RealtimeClient({
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
    sockets[0].serverClose(1012, "restart");

    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
  });

  it("hace dedupe por eventId", () => {
    const onEvent = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new RealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      random: () => 0,
    });

    client.subscribe("visit.status.changed", onEvent);
    client.connect();
    socket.open();

    const duplicated = buildEnvelope(10, { eventId: "evt-dup" });
    socket.serverMessage(duplicated);
    socket.serverMessage(duplicated);

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(client.getState().lastSequence).toBe(10);
  });

  it("respeta ordering por sequence y descarta out-of-order", () => {
    const onEvent = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new RealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      random: () => 0,
    });

    client.subscribe("visit.status.changed", onEvent);
    client.connect();
    socket.open();

    socket.serverMessage(buildEnvelope(20));
    socket.serverMessage(buildEnvelope(21));
    socket.serverMessage(buildEnvelope(19));

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(client.getState().lastSequence).toBe(21);
  });

  it("detecta gap y dispara onGap", () => {
    const onGap = vi.fn();
    const socket = new FakeWebSocket("ws://localhost/ws/v1/visits/stream");
    const client = new RealtimeClient({
      url: "ws://localhost/ws/v1/visits/stream",
      createSocket: () => socket,
      onGap,
      random: () => 0,
    });

    client.subscribe("visit.status.changed", vi.fn());
    client.connect();
    socket.open();

    socket.serverMessage(buildEnvelope(100));
    socket.serverMessage(buildEnvelope(102));

    expect(onGap).toHaveBeenCalledWith({
      expectedSequence: 101,
      receivedSequence: 102,
    });
  });
});

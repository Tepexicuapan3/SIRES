import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRelativeChangeTracker } from "@shared/hooks/useRelativeChangeTracker";

describe("useRelativeChangeTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("el primer render (mount) NO marca nada como 'Nuevo' -- solo siembra el mapa de visto", () => {
    const { result } = renderHook(() =>
      useRelativeChangeTracker([
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T09:30:00.000Z" },
      ]),
    );

    expect(result.current.size).toBe(0);
    expect(result.current.get(1)).toBeUndefined();
    expect(result.current.get(2)).toBeUndefined();
  });

  it("una visita que ENTRA a la lista despues del primer render muestra 'Nuevo' de inmediato", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useRelativeChangeTracker(items),
      {
        initialProps: {
          items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }],
        },
      },
    );

    expect(result.current.get(1)).toBeUndefined();

    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });

    expect(result.current.get(2)).toBe("Nuevo");
    // El item que ya estaba desde el mount sigue sin badge (no cambio).
    expect(result.current.get(1)).toBeUndefined();
  });

  it("un item cuyo changeKey cambia (edicion) vuelve a marcarse 'Nuevo'", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useRelativeChangeTracker(items),
      {
        initialProps: {
          items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }],
        },
      },
    );

    rerender({
      items: [{ id: 1, changeKey: "2026-08-26T09:59:59.000Z" }],
    });

    expect(result.current.get(1)).toBe("Nuevo");
  });

  it("el badge envejece 'Nuevo' -> 'Hace N min' solo por el intervalo local de 30s, sin nuevos props", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useRelativeChangeTracker(items),
      {
        initialProps: {
          items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }],
        },
      },
    );

    // Aparece un item nuevo -> "Nuevo"
    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });
    expect(result.current.get(2)).toBe("Nuevo");

    // Pasan ~2 minutos SIN volver a llamar al hook con props nuevas -- el
    // unico motor de actualizacion es el setInterval(30_000) interno.
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });
    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });

    expect(result.current.get(2)).toBe("Hace 2 min");
  });

  it("pasada una hora, el badge muestra 'Hace N h'", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useRelativeChangeTracker(items),
      {
        initialProps: {
          items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }],
        },
      },
    );

    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });
    expect(result.current.get(2)).toBe("Nuevo");

    act(() => {
      vi.advanceTimersByTime(90 * 60 * 1000);
    });
    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });

    expect(result.current.get(2)).toBe("Hace 1 h");
  });

  it("un item que desaparece de la lista se limpia del tracker (no crece sin limite)", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useRelativeChangeTracker(items),
      {
        initialProps: {
          items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }],
        },
      },
    );

    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });
    expect(result.current.get(2)).toBe("Nuevo");

    rerender({ items: [{ id: 1, changeKey: "2026-08-26T09:00:00.000Z" }] });

    // Vuelve a aparecer el mismo id -> se trata como NUEVO otra vez (perdio
    // su historial al salir de la lista).
    rerender({
      items: [
        { id: 1, changeKey: "2026-08-26T09:00:00.000Z" },
        { id: 2, changeKey: "2026-08-26T10:00:00.000Z" },
      ],
    });
    expect(result.current.get(2)).toBe("Nuevo");
  });
});

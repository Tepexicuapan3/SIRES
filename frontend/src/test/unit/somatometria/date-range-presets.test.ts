import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isValidCustomRange,
  resolvePreset,
} from "@features/somatometria/modules/captura/domain/date-range-presets";

describe("date-range-presets (D12 — fecha LOCAL, nunca toISOString/UTC)", () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    // Mexico (UTC-6, sin horario de verano desde 2022): zona horaria real de
    // uso del sistema. Fija en el proceso para que `Date` local difiera de
    // UTC de forma predecible durante todo este describe.
    process.env.TZ = "America/Mexico_City";
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('preset "hoy" no cruza el dia por UTC cerca de medianoche local', () => {
    // 2026-01-14 23:50 hora LOCAL (UTC-6) == 2026-01-15 05:50 UTC.
    // Si se usara toISOString() (UTC), el dia resultante seria 15, no 14.
    const now = new Date(2026, 0, 14, 23, 50, 0);

    // Confirma la premisa del bug: toISOString() SI cruza el dia.
    expect(now.toISOString().slice(0, 10)).toBe("2026-01-15");

    const { fechaDesde, fechaHasta } = resolvePreset("hoy", now);

    expect(fechaDesde).toBe("2026-01-14");
    expect(fechaHasta).toBe("2026-01-14");
  });

  it('preset "semana" inicia en lunes local', () => {
    // 2026-01-14 es miercoles.
    const wednesday = new Date(2026, 0, 14, 10, 0, 0);
    expect(wednesday.getDay()).toBe(3); // 3 = miercoles

    const { fechaDesde, fechaHasta } = resolvePreset("semana", wednesday);

    expect(fechaDesde).toBe("2026-01-12"); // lunes de esa semana
    expect(fechaHasta).toBe("2026-01-14"); // hoy
  });

  it('preset "semana" cuando hoy ES lunes: fechaDesde == fechaHasta', () => {
    const monday = new Date(2026, 0, 12, 8, 0, 0);
    expect(monday.getDay()).toBe(1);

    const { fechaDesde, fechaHasta } = resolvePreset("semana", monday);

    expect(fechaDesde).toBe("2026-01-12");
    expect(fechaHasta).toBe("2026-01-12");
  });

  it('preset "mes" inicia el dia 1 del mes local', () => {
    const now = new Date(2026, 2, 27, 12, 0, 0); // 27 de marzo

    const { fechaDesde, fechaHasta } = resolvePreset("mes", now);

    expect(fechaDesde).toBe("2026-03-01");
    expect(fechaHasta).toBe("2026-03-27");
  });

  it('preset "anio" inicia el 1 de enero local', () => {
    const now = new Date(2026, 10, 5, 12, 0, 0); // 5 de noviembre

    const { fechaDesde, fechaHasta } = resolvePreset("anio", now);

    expect(fechaDesde).toBe("2026-01-01");
    expect(fechaHasta).toBe("2026-11-05");
  });

  it("rango personalizado con fechaDesde posterior a fechaHasta se rechaza", () => {
    expect(isValidCustomRange("2026-02-10", "2026-02-01")).toBe(false);
  });

  it("rango personalizado con fechaDesde anterior o igual a fechaHasta es valido", () => {
    expect(isValidCustomRange("2026-02-01", "2026-02-10")).toBe(true);
    expect(isValidCustomRange("2026-02-05", "2026-02-05")).toBe(true);
  });

  it("rango incompleto (falta alguna fecha) no se rechaza todavia", () => {
    expect(isValidCustomRange("", "2026-02-10")).toBe(true);
    expect(isValidCustomRange("2026-02-01", "")).toBe(true);
  });
});

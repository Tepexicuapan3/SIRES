import { describe, expect, it } from "vitest";

import { captureVitalsFormSchema } from "@features/somatometria/modules/captura/domain/capture-vitals.schemas";

const baseVitals = {
  weightKg: 70,
  heightCm: 170,
  oxygenSaturationPct: 98,
};

describe("captureVitalsFormSchema temperatureC validation", () => {
  it("acepta temperatura con punto decimal", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: "36.6",
    });

    expect(result.success).toBe(true);
  });

  it("acepta temperatura con coma decimal", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: "36,6",
    });

    expect(result.success).toBe(true);
  });

  it("rechaza temperatura con mas de un decimal", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: "36.66",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe(
      "La temperatura debe tener maximo 1 decimal.",
    );
  });
});

describe("captureVitalsFormSchema oxygenSaturationPct validation", () => {
  it("acepta saturacion valida", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
    });

    expect(result.success).toBe(true);
  });

  it("rechaza saturacion fuera de rango", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
      oxygenSaturationPct: 40,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["oxygenSaturationPct"]);
  });
});

describe("captureVitalsFormSchema observations validation", () => {
  it("normaliza observaciones vacias a undefined", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
      observations: "   ",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.observations).toBeUndefined();
  });

  it("rechaza observaciones mayores a 500 caracteres", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
      observations: "a".repeat(501),
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["observations"]);
  });
});

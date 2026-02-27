import { describe, expect, it } from "vitest";

import { captureVitalsFormSchema } from "@features/flujo-clinico/domain/visit-flow.schemas";

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

describe("captureVitalsFormSchema waistCircumferenceCm validation", () => {
  it("acepta circunferencia abdominal valida", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
      waistCircumferenceCm: 95,
    });

    expect(result.success).toBe(true);
  });

  it("rechaza circunferencia abdominal fuera de rango", () => {
    const result = captureVitalsFormSchema.safeParse({
      ...baseVitals,
      temperatureC: 36.6,
      waistCircumferenceCm: 10,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["waistCircumferenceCm"]);
  });
});

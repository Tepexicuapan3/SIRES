import * as z from "zod";

const parseOptionalNumber = (value: unknown): unknown => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const parseOptionalText = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseLocalizedDecimal = (value: unknown): unknown => {
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (normalized.length === 0) {
      return value;
    }

    return Number(normalized);
  }

  return value;
};

const hasSingleDecimalPrecision = (value: number): boolean => {
  return Math.abs(value * 10 - Math.round(value * 10)) < Number.EPSILON;
};

export const captureVitalsFormSchema = z.object({
  weightKg: z.coerce.number().min(1, { error: "Ingresa el peso en kg." }),
  heightCm: z.coerce.number().min(30, { error: "Ingresa la talla en cm." }),
  temperatureC: z.preprocess(
    parseLocalizedDecimal,
    z
      .number({ error: "Ingresa la temperatura en C." })
      .min(30, { error: "Ingresa la temperatura en C." })
      .max(45, { error: "La temperatura no es valida." })
      .refine(hasSingleDecimalPrecision, {
        error: "La temperatura debe tener maximo 1 decimal.",
      }),
  ),
  oxygenSaturationPct: z.coerce
    .number()
    .int()
    .min(50, { error: "Ingresa la saturacion de O2." })
    .max(100, { error: "La saturacion no es valida." }),
  heartRateBpm: z.preprocess(
    parseOptionalNumber,
    z.coerce.number().int().min(20).max(250).optional(),
  ),
  respiratoryRateBpm: z.preprocess(
    parseOptionalNumber,
    z.coerce.number().int().min(5).max(80).optional(),
  ),
  bloodPressureSystolic: z.preprocess(
    parseOptionalNumber,
    z.coerce.number().int().min(50).max(260).optional(),
  ),
  bloodPressureDiastolic: z.preprocess(
    parseOptionalNumber,
    z.coerce.number().int().min(30).max(180).optional(),
  ),
  waistCircumferenceCm: z.preprocess(
    parseOptionalNumber,
    z.coerce.number().int().min(30).max(250).optional(),
  ),
  notes: z.preprocess(parseOptionalText, z.string().max(255).optional()),
});

export type CaptureVitalsFormValues = z.infer<typeof captureVitalsFormSchema>;
export type CaptureVitalsFormInput = z.input<typeof captureVitalsFormSchema>;

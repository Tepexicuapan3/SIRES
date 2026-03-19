import * as z from "zod";

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
  observations: z
    .string()
    .trim()
    .max(500, {
      error: "Las observaciones deben tener maximo 500 caracteres.",
    })
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      return value === "" ? undefined : value;
    }),
});

export type CaptureVitalsFormValues = z.infer<typeof captureVitalsFormSchema>;
export type CaptureVitalsFormInput = z.input<typeof captureVitalsFormSchema>;

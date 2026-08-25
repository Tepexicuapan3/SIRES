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

const toOptionalInt = (v: unknown): unknown => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

export const captureVitalsFormSchema = z
  .object({
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
      toOptionalInt,
      z.number().int().min(20, { error: "FC minima 20 lpm." }).max(250, { error: "FC maxima 250 lpm." }).optional(),
    ),
    respiratoryRateBpm: z.preprocess(
      toOptionalInt,
      z.number().int().min(5, { error: "FR minima 5 rpm." }).max(80, { error: "FR maxima 80 rpm." }).optional(),
    ),
    bloodPressureSystolic: z.preprocess(
      toOptionalInt,
      z.number().int().min(50, { error: "TA sistolica minima 50." }).max(260, { error: "TA sistolica maxima 260." }).optional(),
    ),
    bloodPressureDiastolic: z.preprocess(
      toOptionalInt,
      z.number().int().min(30, { error: "TA diastolica minima 30." }).max(180, { error: "TA diastolica maxima 180." }).optional(),
    ),
    glucosaCapilarMgdl: z.preprocess(
      toOptionalInt,
      z.number().int().min(20, { error: "Glucosa minima 20 mg/dL." }).max(800, { error: "Glucosa maxima 800 mg/dL." }).optional(),
    ),
    waistCircumferenceCm: z.preprocess(
      toOptionalInt,
      z.number().int().min(30, { error: "Cintura minima 30 cm." }).max(200, { error: "Cintura maxima 200 cm." }).optional(),
    ),
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
  })
  .superRefine((data, ctx) => {
    const { bloodPressureSystolic: sys, bloodPressureDiastolic: dia } = data;
    if (sys !== undefined && dia !== undefined && dia >= sys) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La diastolica debe ser menor que la sistolica.",
        path: ["bloodPressureDiastolic"],
      });
    }
  });

export type CaptureVitalsFormValues = z.infer<typeof captureVitalsFormSchema>;
export type CaptureVitalsFormInput = z.input<typeof captureVitalsFormSchema>;

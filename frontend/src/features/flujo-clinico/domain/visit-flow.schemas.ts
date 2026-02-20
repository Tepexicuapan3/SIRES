import { z } from "zod";
import { ARRIVAL_TYPE } from "@api/types";

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

export const createVisitFormSchema = z
  .object({
    patientId: z.coerce
      .number()
      .int()
      .min(1, { error: "Ingresa un ID de paciente valido." }),
    arrivalType: z.enum([ARRIVAL_TYPE.APPOINTMENT, ARRIVAL_TYPE.WALK_IN]),
    appointmentId: z.preprocess(parseOptionalText, z.string().optional()),
    doctorId: z.preprocess(
      parseOptionalNumber,
      z.coerce.number().int().min(1).optional(),
    ),
    notes: z.preprocess(parseOptionalText, z.string().max(255).optional()),
  })
  .superRefine((data, ctx) => {
    if (
      data.arrivalType === ARRIVAL_TYPE.APPOINTMENT &&
      !data.appointmentId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointmentId"],
        message: "appointmentId es obligatorio para arrivalType=appointment.",
      });
    }

    if (
      data.arrivalType === ARRIVAL_TYPE.WALK_IN &&
      data.appointmentId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointmentId"],
        message: "appointmentId debe ir vacio para arrivalType=walk_in.",
      });
    }
  });

export type CreateVisitFormValues = z.infer<typeof createVisitFormSchema>;
export type CreateVisitFormInput = z.input<typeof createVisitFormSchema>;

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
  notes: z.preprocess(parseOptionalText, z.string().max(255).optional()),
});

export type CaptureVitalsFormValues = z.infer<typeof captureVitalsFormSchema>;
export type CaptureVitalsFormInput = z.input<typeof captureVitalsFormSchema>;

export const closeVisitFormSchema = z.object({
  primaryDiagnosis: z
    .string()
    .trim()
    .min(1, { error: "Ingresa el diagnostico principal." }),
  finalNote: z.string().trim().min(1, { error: "Ingresa la nota final." }),
});

export type CloseVisitFormValues = z.infer<typeof closeVisitFormSchema>;
export type CloseVisitFormInput = z.input<typeof closeVisitFormSchema>;

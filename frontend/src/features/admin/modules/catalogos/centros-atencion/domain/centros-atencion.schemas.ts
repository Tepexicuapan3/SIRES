import { z } from "zod";

const requiredText = (label: string, maxLength = 160) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

const requiredTime = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      error: `${label} invalido`,
    });

export const centroAtencionDetailsSchema = z.object({
  name: requiredText("Nombre"),
  folioCode: requiredText("Folio", 12),
  address: requiredText("Direccion", 220),
  isExternal: z.boolean(),
  morningStartsAt: requiredTime("Horario matutino inicio"),
  morningEndsAt: requiredTime("Horario matutino fin"),
  afternoonStartsAt: requiredTime("Horario vespertino inicio"),
  afternoonEndsAt: requiredTime("Horario vespertino fin"),
  nightStartsAt: requiredTime("Horario nocturno inicio"),
  nightEndsAt: requiredTime("Horario nocturno fin"),
});

export const createCentroAtencionSchema = centroAtencionDetailsSchema;

export type CentroAtencionDetailsFormValues = z.infer<
  typeof centroAtencionDetailsSchema
>;
export type CreateCentroAtencionFormValues = z.infer<
  typeof createCentroAtencionSchema
>;

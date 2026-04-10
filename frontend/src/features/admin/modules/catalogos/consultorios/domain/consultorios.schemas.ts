import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

const requiredPositiveIntegerString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .regex(/^\d+$/, { error: `${label} invalido` })
    .refine((value) => Number(value) > 0, { error: `${label} invalido` });

export const consultorioDetailsSchema = z.object({
  name: requiredText("Nombre"),
  code: requiredPositiveIntegerString("Codigo"),
  idTurn: requiredPositiveIntegerString("Turno"),
  idCenter: requiredPositiveIntegerString("Centro"),
});

export const createConsultorioSchema = consultorioDetailsSchema;

export type ConsultorioDetailsFormValues = z.infer<
  typeof consultorioDetailsSchema
>;
export type CreateConsultorioFormValues = z.infer<
  typeof createConsultorioSchema
>;

import * as z from "zod";

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const estudioMedicoDetailsSchema = z.object({
  name: requiredText("Nombre", 255),
  studyType: requiredText("Tipo de estudio", 20),
  indication: requiredText("Indicacion clinica", 700),
  precio: z.union([z.number(), z.nan()]).optional(),
  isGeneral: z.boolean().optional(),
  isAuthorized: z.boolean().optional(),
  groupType: z.union([z.number(), z.nan()]).optional(),
  providerId: z.union([z.number(), z.nan()]).optional(),
});

export const createEstudioMedicoSchema = estudioMedicoDetailsSchema;

export type EstudioMedicoDetailsFormValues = z.infer<
  typeof estudioMedicoDetailsSchema
>;
export type CreateEstudioMedicoFormValues = z.infer<
  typeof createEstudioMedicoSchema
>;

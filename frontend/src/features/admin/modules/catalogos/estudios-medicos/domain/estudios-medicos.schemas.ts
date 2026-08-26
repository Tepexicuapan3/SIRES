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
});

export const createEstudioMedicoSchema = estudioMedicoDetailsSchema;

export type EstudioMedicoDetailsFormValues = z.infer<
  typeof estudioMedicoDetailsSchema
>;
export type CreateEstudioMedicoFormValues = z.infer<
  typeof createEstudioMedicoSchema
>;

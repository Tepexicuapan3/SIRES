import * as z from "zod";

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const estudioDetailsSchema = z.object({
  name: requiredText("Nombre", 255),
  studyType: requiredText("Tipo de estudio", 20),
  precio: z.union([z.number(), z.nan()]).optional(),
  indication: z.string().trim().max(700).optional(),
});

export const createEstudioSchema = estudioDetailsSchema;

export type EstudioDetailsFormValues = z.infer<typeof estudioDetailsSchema>;
export type CreateEstudioFormValues = z.infer<typeof createEstudioSchema>;

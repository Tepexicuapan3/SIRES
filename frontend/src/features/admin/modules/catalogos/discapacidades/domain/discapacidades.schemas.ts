import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const discapacidadDetailsSchema = z.object({
  name: requiredText("Nombre", 300),
  code: requiredText("Clave", 10),
});

export const createDiscapacidadSchema = discapacidadDetailsSchema;

export type DiscapacidadDetailsFormValues = z.infer<typeof discapacidadDetailsSchema>;
export type CreateDiscapacidadFormValues = z.infer<typeof createDiscapacidadSchema>;

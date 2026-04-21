import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const escolaridadDetailsSchema = z.object({
  name: requiredText("Nombre", 45),
});

export const createEscolaridadSchema = escolaridadDetailsSchema;

export type EscolaridadDetailsFormValues = z.infer<typeof escolaridadDetailsSchema>;
export type CreateEscolaridadFormValues = z.infer<typeof createEscolaridadSchema>;

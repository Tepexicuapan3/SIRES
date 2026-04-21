import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const escuelaDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
  code: requiredText("Codigo", 45),
});

export const createEscuelaSchema = escuelaDetailsSchema;

export type EscuelaDetailsFormValues = z.infer<typeof escuelaDetailsSchema>;
export type CreateEscuelaFormValues = z.infer<typeof createEscuelaSchema>;

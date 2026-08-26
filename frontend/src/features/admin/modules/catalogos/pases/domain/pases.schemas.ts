import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const paseDetailsSchema = z.object({
  name: requiredText("Nombre", 50),
});

export const createPaseSchema = paseDetailsSchema;

export type PaseDetailsFormValues = z.infer<typeof paseDetailsSchema>;
export type CreatePaseFormValues = z.infer<typeof createPaseSchema>;

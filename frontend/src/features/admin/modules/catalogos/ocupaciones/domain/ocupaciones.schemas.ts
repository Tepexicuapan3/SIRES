import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const ocupacionDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createOcupacionSchema = ocupacionDetailsSchema;

export type OcupacionDetailsFormValues = z.infer<typeof ocupacionDetailsSchema>;
export type CreateOcupacionFormValues = z.infer<typeof createOcupacionSchema>;

import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const licenciaDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createLicenciaSchema = licenciaDetailsSchema;

export type LicenciaDetailsFormValues = z.infer<typeof licenciaDetailsSchema>;
export type CreateLicenciaFormValues = z.infer<typeof createLicenciaSchema>;

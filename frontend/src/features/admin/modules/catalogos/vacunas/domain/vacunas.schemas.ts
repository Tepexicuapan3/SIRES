import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const vacunaDetailsSchema = z.object({
  name: requiredText("Nombre", 200),
});

export const createVacunaSchema = vacunaDetailsSchema;

export type VacunaDetailsFormValues = z.infer<typeof vacunaDetailsSchema>;
export type CreateVacunaFormValues = z.infer<typeof createVacunaSchema>;

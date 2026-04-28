import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const especialidadDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createEspecialidadSchema = especialidadDetailsSchema;

export type EspecialidadDetailsFormValues = z.infer<
  typeof especialidadDetailsSchema
>;
export type CreateEspecialidadFormValues = z.infer<
  typeof createEspecialidadSchema
>;

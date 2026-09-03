import * as z from "zod";

const requiredText = (label: string, maxLength = 45) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoResidenciaDetailsSchema = z.object({
  name: requiredText("Nombre", 45),
});

export const createTipoResidenciaSchema = tipoResidenciaDetailsSchema;

export type TipoResidenciaDetailsFormValues = z.infer<typeof tipoResidenciaDetailsSchema>;
export type CreateTipoResidenciaFormValues = z.infer<typeof createTipoResidenciaSchema>;

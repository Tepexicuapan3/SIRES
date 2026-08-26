import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoSanguineoDetailsSchema = z.object({
  name: requiredText("Nombre", 50),
});

export const createTipoSanguineoSchema = tipoSanguineoDetailsSchema;

export type TipoSanguineoDetailsFormValues = z.infer<typeof tipoSanguineoDetailsSchema>;
export type CreateTipoSanguineoFormValues = z.infer<typeof createTipoSanguineoSchema>;

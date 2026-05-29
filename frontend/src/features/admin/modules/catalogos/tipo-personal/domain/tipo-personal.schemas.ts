import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoPersonalDetailsSchema = z.object({
  name: requiredText("Nombre", 80),
});

export const createTipoPersonalSchema = tipoPersonalDetailsSchema;

export type TipoPersonalDetailsFormValues = z.infer<typeof tipoPersonalDetailsSchema>;
export type CreateTipoPersonalFormValues = z.infer<typeof createTipoPersonalSchema>;

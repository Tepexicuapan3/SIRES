import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoConsultaDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createTipoConsultaSchema = tipoConsultaDetailsSchema;

export type TipoConsultaDetailsFormValues = z.infer<
  typeof tipoConsultaDetailsSchema
>;
export type CreateTipoConsultaFormValues = z.infer<
  typeof createTipoConsultaSchema
>;

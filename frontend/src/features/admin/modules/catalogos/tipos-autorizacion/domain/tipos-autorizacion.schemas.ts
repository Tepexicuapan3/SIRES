import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoAutorizacionDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
  code: requiredText("Codigo", 2),
});

export const createTipoAutorizacionSchema = tipoAutorizacionDetailsSchema;

export type TipoAutorizacionDetailsFormValues = z.infer<typeof tipoAutorizacionDetailsSchema>;
export type CreateTipoAutorizacionFormValues = z.infer<typeof createTipoAutorizacionSchema>;

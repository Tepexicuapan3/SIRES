import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoAreaDetailsSchema = z.object({
  name: requiredText("Nombre", 50),
});

export const createTipoAreaSchema = tipoAreaDetailsSchema;

export type TipoAreaDetailsFormValues = z.infer<typeof tipoAreaDetailsSchema>;
export type CreateTipoAreaFormValues = z.infer<typeof createTipoAreaSchema>;

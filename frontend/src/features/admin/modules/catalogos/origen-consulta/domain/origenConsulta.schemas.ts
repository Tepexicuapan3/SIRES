import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const origenConsultaDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createOrigenConsultaSchema = z.object({
  id: requiredText("Codigo", 2),
  name: requiredText("Nombre", 100),
});

export type OrigenConsultaDetailsFormValues = z.infer<typeof origenConsultaDetailsSchema>;
export type CreateOrigenConsultaFormValues = z.infer<typeof createOrigenConsultaSchema>;

import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const calidadLaboralDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
});

export const createCalidadLaboralSchema = z.object({
  id: requiredText("Codigo", 2),
  name: requiredText("Nombre", 100),
});

export type CalidadLaboralDetailsFormValues = z.infer<typeof calidadLaboralDetailsSchema>;
export type CreateCalidadLaboralFormValues = z.infer<typeof createCalidadLaboralSchema>;

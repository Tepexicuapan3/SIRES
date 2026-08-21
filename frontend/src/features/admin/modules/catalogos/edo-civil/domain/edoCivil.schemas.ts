import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const edoCivilDetailsSchema = z.object({
  name: requiredText("Nombre", 45),
});

export const createEdoCivilSchema = edoCivilDetailsSchema;

export type EdoCivilDetailsFormValues = z.infer<typeof edoCivilDetailsSchema>;
export type CreateEdoCivilFormValues = z.infer<typeof createEdoCivilSchema>;

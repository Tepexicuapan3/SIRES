import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const enfermedadDetailsSchema = z.object({
  name: requiredText("Nombre", 400),
  code: requiredText("Codigo", 120),
  cieVersion: requiredText("Version CIE", 5),
});

export const createEnfermedadSchema = enfermedadDetailsSchema;

export type EnfermedadDetailsFormValues = z.infer<typeof enfermedadDetailsSchema>;
export type CreateEnfermedadFormValues = z.infer<typeof createEnfermedadSchema>;

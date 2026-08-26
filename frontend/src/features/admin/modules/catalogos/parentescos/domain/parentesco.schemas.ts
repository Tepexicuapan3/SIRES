import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const parentescoDetailsSchema = z.object({
  name: requiredText("Nombre", 45),
});

export const createParentescoSchema = z.object({
  id: requiredText("Codigo", 2),
  name: requiredText("Nombre", 45),
});

export type ParentescoDetailsFormValues = z.infer<typeof parentescoDetailsSchema>;
export type CreateParentescoFormValues = z.infer<typeof createParentescoSchema>;

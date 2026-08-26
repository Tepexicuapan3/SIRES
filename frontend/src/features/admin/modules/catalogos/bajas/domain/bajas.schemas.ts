import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const bajaDetailsSchema = z.object({
  name: requiredText("Nombre", 250),
});

export const createBajaSchema = bajaDetailsSchema;

export type BajaDetailsFormValues = z.infer<typeof bajaDetailsSchema>;
export type CreateBajaFormValues = z.infer<typeof createBajaSchema>;

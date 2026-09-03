import * as z from "zod";

const requiredText = (label: string, maxLength = 45) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const religionDetailsSchema = z.object({
  name: requiredText("Nombre", 45),
});

export const createReligionSchema = religionDetailsSchema;

export type ReligionDetailsFormValues = z.infer<typeof religionDetailsSchema>;
export type CreateReligionFormValues = z.infer<typeof createReligionSchema>;

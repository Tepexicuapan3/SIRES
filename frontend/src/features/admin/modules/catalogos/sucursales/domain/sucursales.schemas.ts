import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const createSucursalSchema = z.object({
  name: requiredText("Nombre", 100),
});

export type CreateSucursalFormValues = z.infer<typeof createSucursalSchema>;

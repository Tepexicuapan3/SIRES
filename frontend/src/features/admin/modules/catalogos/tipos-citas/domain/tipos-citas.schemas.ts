import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const tipoCitaDetailsSchema = z.object({
  name: requiredText("Nombre", 50),
});

export const createTipoCitaSchema = tipoCitaDetailsSchema;

export type TipoCitaDetailsFormValues = z.infer<typeof tipoCitaDetailsSchema>;
export type CreateTipoCitaFormValues = z.infer<typeof createTipoCitaSchema>;

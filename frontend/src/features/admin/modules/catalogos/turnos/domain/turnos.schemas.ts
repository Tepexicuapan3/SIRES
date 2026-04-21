import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const turnoDetailsSchema = z.object({
  name: requiredText("Nombre", 50),
});

export const createTurnoSchema = turnoDetailsSchema;

export type TurnoDetailsFormValues = z.infer<typeof turnoDetailsSchema>;
export type CreateTurnoFormValues = z.infer<typeof createTurnoSchema>;

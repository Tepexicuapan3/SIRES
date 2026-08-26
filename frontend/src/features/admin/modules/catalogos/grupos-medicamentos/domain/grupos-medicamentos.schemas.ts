import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const grupoMedicamentosDetailsSchema = z.object({
  name: requiredText("Nombre", 255),
});

export const createGrupoMedicamentosSchema = grupoMedicamentosDetailsSchema;

export type GrupoMedicamentosDetailsFormValues = z.infer<typeof grupoMedicamentosDetailsSchema>;
export type CreateGrupoMedicamentosFormValues = z.infer<typeof createGrupoMedicamentosSchema>;

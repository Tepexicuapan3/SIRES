import { z } from "zod";

const requiredInt = (label: string, min = 0) =>
  z.number({ error: `${label} es requerido` }).int().min(min, { error: `${label} debe ser mayor o igual a ${min}` });

export const createInventarioSchema = z.object({
  vaccineId: requiredInt("Vacuna", 1),
  centerId: requiredInt("Centro de atención", 1),
  stockQuantity: requiredInt("Cantidad en existencia"),
});

export const updateInventarioSchema = z.object({
  stockQuantity: requiredInt("Cantidad en existencia").optional(),
  isActive: z.boolean().optional(),
});

export type CreateInventarioFormValues = z.infer<typeof createInventarioSchema>;
export type UpdateInventarioFormValues = z.infer<typeof updateInventarioSchema>;

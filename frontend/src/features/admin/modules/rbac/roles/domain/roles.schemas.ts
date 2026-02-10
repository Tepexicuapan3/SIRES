import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, { error: "Nombre requerido" }),
  description: z.string().min(1, { error: "Descripcion requerida" }),
  landingRoute: z.string().max(120).optional(),
});

export const roleDetailsSchema = z.object({
  name: z.string().min(1, { error: "Nombre requerido" }),
  description: z.string().min(1, { error: "Descripcion requerida" }),
  landingRoute: z.string().max(120).optional(),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
export type RoleDetailsFormValues = z.infer<typeof roleDetailsSchema>;

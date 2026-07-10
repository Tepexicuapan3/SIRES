import * as z from "zod";

const CODE_PATTERN = /^[a-z][a-z0-9_]*(:[a-z][a-z0-9_]*){1,4}$/;

export const createPermissionSchema = z.object({
  code: z
    .string()
    .min(1, { error: "Codigo requerido" })
    .regex(CODE_PATTERN, {
      error:
        "Formato invalido. Usa modulo:submodulo:accion en minusculas (ej. servicios:contratos_oxigeno:read)",
    }),
  name: z.string().min(1, { error: "Descripcion requerida" }),
});

export type CreatePermissionFormValues = z.infer<typeof createPermissionSchema>;

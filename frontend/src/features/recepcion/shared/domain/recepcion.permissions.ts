import type { PermissionRequirement } from "@/domains/auth-access/types/permission-dependencies";

export const RECEPCION_WRITE_PERMISSIONS = [
  "recepcion:fichas:medicina_general:create",
  "recepcion:fichas:especialidad:create",
  "recepcion:fichas:urgencias:create",
] as const;

export const RECEPCION_QUEUE_READ_PERMISSIONS = [
  ...RECEPCION_WRITE_PERMISSIONS,
  "clinico:consultas:read",
  "clinico:somatometria:read",
] as const;

export const RECEPCION_WRITE_PERMISSION_REQUIREMENT = {
  anyOf: RECEPCION_WRITE_PERMISSIONS,
} as const satisfies PermissionRequirement;

export const RECEPCION_QUEUE_PERMISSION_REQUIREMENT = {
  anyOf: RECEPCION_QUEUE_READ_PERMISSIONS,
} as const satisfies PermissionRequirement;

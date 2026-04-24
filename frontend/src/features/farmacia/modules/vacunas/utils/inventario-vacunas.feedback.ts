interface ApiError {
  response?: { data?: { code?: string; message?: string } };
  message?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  VAC_INVENTORY_NOT_FOUND: "El registro de inventario no existe.",
  VAC_INVENTORY_EXISTS: "Ya existe un inventario para esa vacuna en ese centro.",
  VAC_INVENTORY_INACTIVE: "El registro está inactivo. No se pueden aplicar dosis.",
  VAC_DOSES_EXCEED_STOCK: "La cantidad solicitada supera las dosis disponibles.",
  VALIDATION_ERROR: "Los datos enviados son inválidos.",
  INSUFFICIENT_PERMISSIONS: "No tienes permiso para esta acción.",
};

export function getInventarioErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiError;
  const code = err?.response?.data?.code;
  if (code && code in ERROR_MESSAGES) return ERROR_MESSAGES[code];
  return err?.response?.data?.message ?? err?.message ?? fallback;
}

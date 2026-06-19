export const expedientesKeys = {
  all: ['admin', 'expedientes'] as const,
  detail: (idEmpleado: string) =>
    [...expedientesKeys.all, 'detail', idEmpleado] as const,
  byName: (nombre: string) =>
    [...expedientesKeys.all, 'nombre', nombre] as const,
};
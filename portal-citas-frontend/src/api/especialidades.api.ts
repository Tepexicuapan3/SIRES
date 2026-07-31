/**
 * Catálogo de especialidades del portal (Fase 3 del backend), usado para
 * poblar el selector de filtro de `GET /portal/slots`.
 *
 * Contrato confirmado leyendo el código real del backend:
 *   - Ruta: backend/apps/portal_citas/urls.py:34 (GET /portal/especialidades).
 *   - Vista: backend/apps/portal_citas/views.py:219-230 (EspecialidadesPortalView,
 *     misma auth Bearer que el resto de Fase 3).
 *   - Shape: backend/apps/portal_citas/services/especialidades_service.py:19-28
 *     (`listar_especialidades`) devuelve `{ especialidades: [{especialidadId,
 *     nombre}, ...] }` (envuelto en la key `especialidades`), ya filtrado a
 *     `is_active=True` y ordenado por nombre — no hace falta filtrar/ordenar
 *     de nuevo en el cliente.
 */

import apiClient from "@/api/client";

export interface Especialidad {
  /** `Especialidades.id` (BigAutoField) — ver backend/apps/catalogos/models/especialidades.py:7. */
  especialidadId: number;
  nombre: string;
}

export function listarEspecialidades(): Promise<Especialidad[]> {
  return apiClient
    .get<{ especialidades: Especialidad[] }>("/portal/especialidades")
    .then((res) => res.data.especialidades);
}

/**
 * Disponibilidad de horarios del portal (Fase 3 del backend).
 *
 * Contrato confirmado leyendo el código real del backend:
 *   - Ruta: backend/apps/portal_citas/urls.py:35
 *     (GET /portal/slots?fecha=YYYY-MM-DD&especialidadId=...).
 *   - Query params: backend/apps/portal_citas/views.py:197-204
 *     (`SlotsPortalQuerySerializer`) — `fecha` requerida (`YYYY-MM-DD`),
 *     `especialidadId` opcional (entero >= 1); sin ese filtro se listan
 *     slots de todos los médicos.
 *   - Vista: backend/apps/portal_citas/views.py:235-256 (SlotsPortalView,
 *     misma auth Bearer que el resto de Fase 3).
 *   - Shape: backend/apps/portal_citas/services/slots_service.py:74-103
 *     (`get_slots_portal`) devuelve `{ slots: [{slotId, fecha, hora,
 *     consultorioNombre, especialidadPrincipal, medicoNombre, estado},
 *     ...] }` (envuelto en la key `slots`) — lista TODOS los slots del día
 *     con `canal` apto para portal ("LINEA"/"AMBOS"), disponibles Y
 *     ocupados, ya ordenados por hora. `estado` refleja el valor real de
 *     `HorarioDisponible.disponible` (`"disponible"` / `"ocupado"`) — ya
 *     NO viene hardcodeado. El shape de salida deliberadamente NO expone
 *     quién ocupa un slot ocupado (sin join a `CitaMedica` ni datos de
 *     paciente/folio) — ver el docstring de `slots_service.py`.
 */

import apiClient from "@/api/client";

export interface Slot {
  /** `HorarioDisponible.id` (PK entero por defecto). */
  slotId: number;
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** `HH:MM` (slots_service.py:96 trunca el `TimeField` a 5 caracteres). */
  hora: string;
  consultorioNombre: string | null;
  /** Nombre de la especialidad principal del médico, o "Medicina General" si no tiene ninguna. */
  especialidadPrincipal: string;
  medicoNombre: string;
  /** "ocupado" nunca trae datos del paciente/cita — solo indica que la celda no está disponible. */
  estado: "disponible" | "ocupado";
}

export interface BuscarSlotsParams {
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** Sin especificar, `GET /portal/slots` no filtra por especialidad. */
  especialidadId?: number;
}

export function buscarSlots({ fecha, especialidadId }: BuscarSlotsParams): Promise<Slot[]> {
  return apiClient
    .get<{ slots: Slot[] }>("/portal/slots", {
      params: especialidadId === undefined ? { fecha } : { fecha, especialidadId },
    })
    .then((res) => res.data.slots);
}

/**
 * Disponibilidad de horarios del portal (Fase 3 del backend).
 *
 * Contrato confirmado leyendo el código real del backend:
 *   - Ruta: backend/apps/portal_citas/urls.py:35
 *     (GET /portal/slots?fecha=YYYY-MM-DD&consultorioId=&especialidadId=...).
 *   - Query params: backend/apps/portal_citas/views.py:197-204
 *     (`SlotsPortalQuerySerializer`) — `fecha` requerida (`YYYY-MM-DD`),
 *     `consultorioId` opcional (entero >= 1, filtro efectivo, Fase 6 del
 *     portal — ver `sdd/portal-citas-consultorios/design`), `especialidadId`
 *     opcional (entero >= 1) marcado DEPRECATED — se mantiene solo para
 *     compatibilidad con clientes que aún no migraron; sin ningún filtro se
 *     listan slots de todos los médicos.
 *   - Vista: backend/apps/portal_citas/views.py:235-256 (SlotsPortalView,
 *     misma auth Bearer que el resto de Fase 3).
 *   - Shape: backend/apps/portal_citas/services/slots_service.py:74-103
 *     (`get_slots_portal`) devuelve `{ slots: [{slotId, fecha, hora,
 *     consultorioNombre, especialidadPrincipal, estado}, ...] }` (envuelto
 *     en la key `slots`) — lista TODOS los slots del día con `canal` apto
 *     para portal ("LINEA"/"AMBOS"), disponibles Y ocupados, ya ordenados
 *     por hora. `estado` refleja el valor real de
 *     `HorarioDisponible.disponible` (`"disponible"` / `"ocupado"`) — ya
 *     NO viene hardcodeado. El shape de salida deliberadamente NO expone
 *     quién ocupa un slot ocupado (sin join a `CitaMedica` ni datos de
 *     paciente/folio), NI el nombre del médico del slot (privacidad —
 *     `sdd/portal-citas-filtro-clinica/design`: el médico solo se revela
 *     después de reservar, vía `POST /portal/citas` / `GET /portal/citas`)
 *     — ver el docstring de `slots_service.py`.
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
  /** "ocupado" nunca trae datos del paciente/cita — solo indica que la celda no está disponible. */
  estado: "disponible" | "ocupado";
}

export interface BuscarSlotsParams {
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** Filtro efectivo (Fase 6 — calendario mensual por consultorio). */
  consultorioId?: number;
  /**
   * @deprecated Se mantiene solo para compatibilidad con clientes que aún no
   * migraron al filtro por `consultorioId`. Remover una release después de
   * desplegar el portal nuevo (ver `sdd/portal-citas-consultorios/design`).
   */
  especialidadId?: number;
}

export function buscarSlots({
  fecha,
  consultorioId,
  especialidadId,
}: BuscarSlotsParams): Promise<Slot[]> {
  return apiClient
    .get<{ slots: Slot[] }>("/portal/slots", {
      params: {
        fecha,
        ...(consultorioId !== undefined ? { consultorioId } : {}),
        ...(especialidadId !== undefined ? { especialidadId } : {}),
      },
    })
    .then((res) => res.data.slots);
}

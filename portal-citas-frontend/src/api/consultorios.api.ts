/**
 * Catálogo de consultorios habilitados para canal en línea + disponibilidad
 * mensual agregada (Fase 6 del frontend — reemplaza el filtro por
 * especialidad del calendario semanal).
 *
 * Contrato confirmado contra el diseño de
 * `sdd/portal-citas-consultorios/design` (el backend implementa estos 2
 * endpoints en paralelo siguiendo el mismo contrato):
 *
 *   - `GET /portal/consultorios?centroId=` (Bearer, `IsPortalUser`) →
 *     catálogo derivado dinámicamente de `RelMedicoConsultorioHorario.canal`
 *     en `["LINEA", "AMBOS"]` + `is_active=True`. `centroId` (entero >= 1)
 *     es un filtro opcional (`sdd/portal-citas-filtro-clinica/design`): sin
 *     él se devuelven todos los consultorios online; con él, solo los de
 *     ese centro (200 con `[]` si no existe o no tiene consultorios online
 *     — nunca 404, evita enumeración). Shape:
 *     `{ consultorios: [{consultorioId, nombre, numero, centroId, centroNombre}, ...] }`.
 *
 *   - `GET /portal/consultorios/{id}/disponibilidad-mensual?anio=&mes=`
 *     (Bearer) → conteo agregado de slots disponibles por fecha, en una
 *     sola consulta server-side (sin bajar los slots individuales del mes).
 *     Solo se devuelven fechas CON cupo (`slotsDisponibles >= 1`); un
 *     consultorio inexistente/no habilitado responde `dias: []` (200, no
 *     404 — evita enumeración). Shape:
 *     `{ consultorioId, anio, mes, dias: [{fecha, slotsDisponibles}, ...] }`.
 *     `anio` válido 2020–2100, `mes` 1–12 (422 `VALIDATION_ERROR` fuera de
 *     rango).
 *
 *   - `GET /portal/centros` (Bearer, `IsPortalUser`) → catálogo de centros
 *     con al menos un consultorio online, derivado de la misma lista
 *     cacheada que `/portal/consultorios` (dedup por `centroId`, ordenado
 *     por `nombre`). Shape: `{ centros: [{centroId, nombre}, ...] }`. Ver
 *     `sdd/portal-citas-filtro-clinica/design`.
 */

import apiClient from "@/api/client";

export interface Consultorio {
  consultorioId: number;
  nombre: string;
  numero: number;
  centroId: number | null;
  centroNombre: string | null;
}

export interface Centro {
  centroId: number;
  nombre: string;
}

export interface DiaDisponible {
  /** `YYYY-MM-DD`. */
  fecha: string;
  slotsDisponibles: number;
}

export function listarConsultorios(centroId?: number): Promise<Consultorio[]> {
  return apiClient
    .get<{ consultorios: Consultorio[] }>("/portal/consultorios", {
      params: centroId !== undefined ? { centroId } : undefined,
    })
    .then((res) => res.data.consultorios);
}

export function listarCentros(): Promise<Centro[]> {
  return apiClient
    .get<{ centros: Centro[] }>("/portal/centros")
    .then((res) => res.data.centros);
}

export function disponibilidadMensual(
  consultorioId: number,
  anio: number,
  mes: number,
): Promise<DiaDisponible[]> {
  return apiClient
    .get<{ consultorioId: number; anio: number; mes: number; dias: DiaDisponible[] }>(
      `/portal/consultorios/${consultorioId}/disponibilidad-mensual`,
      { params: { anio, mes } },
    )
    .then((res) => res.data.dias);
}

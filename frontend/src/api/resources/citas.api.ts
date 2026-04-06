// frontend/src/api/resources/citas.api.ts
// Ubicación: junto a visits.api.ts, auth.api.ts, etc.

import apiClient from "@/api/client";
import type {
    CitaMedica,
    CrearCitaForm,
    FiltrosCitas,
    NucleoFamiliar,
    Paciente,
    PaginatedCitas,
    SlotDisponible,
} from "@/features/recepcion/modules/citas/types/citas.types";

const BASE = "/citas";

// ── Núcleo familiar ───────────────────────────────────────────────────────────

export async function getNucleoFamiliar(noExp: number): Promise<NucleoFamiliar> {
    const res = await apiClient.get<NucleoFamiliar>(
    `${BASE}/nucleo-familiar/${noExp}/`
    );
    return res.data;
}

export async function buscarEmpleados(q: string): Promise<Paciente[]> {
    const res = await apiClient.get<Paciente[]>(`${BASE}/buscar-empleados/`, {
    params: { q },
  });
  return res.data;
}

// ── Disponibilidad ────────────────────────────────────────────────────────────

export async function getDisponibilidad(params: {
  medico_id: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}): Promise<SlotDisponible[]> {
  const res = await apiClient.get<SlotDisponible[]>(`${BASE}/disponibilidad/`, {
    params,
  });
  return res.data;
}

// ── CRUD de citas ─────────────────────────────────────────────────────────────

export async function crearCita(data: CrearCitaForm): Promise<CitaMedica> {
  const res = await apiClient.post<CitaMedica>(`${BASE}/`, data);
  return res.data;
}

export async function listarCitas(filtros: FiltrosCitas): Promise<PaginatedCitas> {
  const res = await apiClient.get<PaginatedCitas>(`${BASE}/`, { params: filtros });
  return res.data;
}

export async function getCita(id: string): Promise<CitaMedica> {
  const res = await apiClient.get<CitaMedica>(`${BASE}/${id}/`);
  return res.data;
}

export async function cancelarCita(
  id: string,
  motivo: string = ""
): Promise<CitaMedica> {
  const res = await apiClient.post<CitaMedica>(`${BASE}/${id}/cancelar/`, { motivo });
  return res.data;
}

// URL directa para descarga — se usa como href en <a>
export const getPdfUrl = (id: string) => `${BASE}/${id}/pdf/`;
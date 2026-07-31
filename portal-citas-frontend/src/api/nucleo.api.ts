/**
 * Núcleo familiar del portal (Fase 3 del backend).
 *
 * Contrato confirmado leyendo el código real del backend (NO asumido):
 *   - Ruta: backend/apps/portal_citas/urls.py:33 (GET /portal/nucleo).
 *   - Vista: backend/apps/portal_citas/views.py:205-216 (NucleoView, exige
 *     PortalTokenAuthentication + IsPortalUser — mismo Bearer token que ya
 *     adjunta `@/api/client.ts`, no requiere tocar el cliente HTTP).
 *   - Shape: backend/apps/portal_citas/services/nucleo_service.py:78-119
 *     (`obtener_nucleo`) devuelve `{ nucleo: [{miembroId, nombreVisible,
 *     esMenor}, ...] }` — la respuesta va envuelta en la key `nucleo`, no es
 *     un array pelado.
 *
 * Regla de negocio (documentada en el backend, no reimplementada acá): el
 * titular ve todo el núcleo; un derechohabiente adulto logueado por su
 * cuenta solo se ve a sí mismo + los menores del mismo expediente.
 */

import apiClient from "@/api/client";

export interface MiembroNucleo {
  /** UUID opaco de `PortalMiembro` (ver ReservarCitaSerializer.miembroId, UUIDField). */
  miembroId: string;
  nombreVisible: string;
  esMenor: boolean;
}

export function obtenerNucleo(): Promise<MiembroNucleo[]> {
  return apiClient
    .get<{ nucleo: MiembroNucleo[] }>("/portal/nucleo")
    .then((res) => res.data.nucleo);
}

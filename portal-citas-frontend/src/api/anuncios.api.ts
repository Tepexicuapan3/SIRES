/**
 * Anuncios/flyers vigentes publicados desde SISEM — banner del portal de
 * citas (`sdd/anuncios-portal-citas`).
 *
 * Contrato confirmado contra `sdd/anuncios-portal-citas/design` (el backend
 * implementa este endpoint en paralelo siguiendo el mismo contrato):
 *
 *   - `GET /portal/anuncios` (Bearer, `IsPortalUser` — mismo molde que
 *     Especialidades/Consultorios/Slots) → solo anuncios `activo=True`, no
 *     eliminados (`eliminado_en` nulo) y vigentes hoy (`vigencia_desde` <=
 *     hoy o null, `vigencia_hasta` >= hoy o null), ordenados por `orden`
 *     asc y, en empate, por `creado_en` desc. Nunca 404: responde
 *     `{ anuncios: [] }` si no hay ninguno vigente.
 *     Shape: `{ anuncios: [{id, titulo, descripcion, imagenUrl,
 *     adjuntoUrl, enlaceUrl, orden}, ...] }`.
 *   - `imagenUrl`/`adjuntoUrl` son rutas relativas (`/media/...`) servidas
 *     por nginx con `alias`, desde el mismo origin que el portal — se usan
 *     tal cual en `src`/`href`, sin anteponer `env.apiUrl`.
 */

import apiClient from "@/api/client";

export interface Anuncio {
  id: number;
  titulo: string;
  descripcion: string;
  /** Ruta relativa (`/media/...`) — usar tal cual en `<img src>`. */
  imagenUrl: string;
  /** Ruta relativa (`/media/...`) al PDF adjunto, o `null` si no tiene. */
  adjuntoUrl: string | null;
  /** URL externa opcional a la que enlaza el anuncio, o `null`. */
  enlaceUrl: string | null;
  orden: number;
}

export function listarAnunciosVigentes(): Promise<Anuncio[]> {
  return apiClient
    .get<{ anuncios: Anuncio[] }>("/portal/anuncios")
    .then((res) => res.data.anuncios);
}

/**
 * Draft de reserva del portal — miembro elegido + slot elegido.
 * ================================================================
 *
 * DECISIÓN: sessionStorage (mismo patrón que `@/api/authStore.ts`), no
 * Context/estado de React en memoria.
 *
 * Por qué: el paso 3 (elegir slot) navega a una ruta nueva
 * (`/reservar/confirmar`, placeholder de F2 — la pantalla real de
 * confirmación + `POST /portal/citas` es F3). Si el draft viviera solo en
 * estado de React del árbol de `HomePage`, un refresh de página en
 * `/reservar/confirmar` (F3 sí necesitará poder recargar esa pantalla para
 * mostrar el resumen antes de confirmar) lo perdería, obligando a repetir
 * los 3 pasos. sessionStorage sobrevive la navegación y un refresh dentro
 * de la misma pestaña, y se limpia solo al cerrar la pestaña — igual de
 * aceptable acá que para el token: es un dato transaccional de corta vida
 * (dura lo que dura el trámite de reserva), no algo que deba persistir
 * entre visitas.
 *
 * Se guarda el SLOT COMPLETO (no solo `slotId`) porque F3 necesita mostrar
 * un resumen legible (hora, consultorio, médico/especialidad) antes de
 * confirmar sin tener que volver a pedirle `GET /portal/slots` al backend
 * ni recibir esos datos de vuelta en el `POST /portal/citas`.
 *
 * Este módulo es el ÚNICO lugar que toca esta key de sessionStorage — F3
 * debe leer/limpiar el draft solo a través de estas funciones, nunca
 * accediendo a sessionStorage directamente (mismo criterio que
 * `authStore.ts` para el token).
 */

import type { MiembroNucleo } from "@/api/nucleo.api";
import type { Slot } from "@/api/slots.api";

const DRAFT_KEY = "portal_citas.reserva_draft";

export interface ReservaDraft {
  miembroId: string;
  /** Copiado de `MiembroNucleo.nombreVisible` al momento de elegir — solo para mostrar el resumen en F3, no es fuente de verdad. */
  nombreVisibleMiembro: string;
  slot: Slot;
}

export function getReservaDraft(): ReservaDraft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ReservaDraft;
  } catch {
    // Draft corrupto (no debería pasar salvo edición manual): se descarta
    // en vez de romper la pantalla de confirmación.
    sessionStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function setReservaDraft(miembro: MiembroNucleo, slot: Slot): void {
  const draft: ReservaDraft = {
    miembroId: miembro.miembroId,
    nombreVisibleMiembro: miembro.nombreVisible,
    slot,
  };
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearReservaDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

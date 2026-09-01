import { useEffect, useState } from "react";

import { listarAnunciosVigentes, type Anuncio } from "@/api/anuncios.api";
import AnunciosCarousel from "@/components/AnunciosCarousel";

/**
 * Banner de anuncios/flyers publicados desde SISEM (`sdd/anuncios-portal-citas`).
 *
 * DECISIÓN ACTUALIZADA (pisa el MUST anterior de "lista apilada, NO
 * carrusel" documentado en `sdd/anuncios-portal-citas/spec`, dominio
 * `comunicados/portal-banner-ui`): se adopta un carrusel con autoplay,
 * pedido explícitamente por el usuario, PERO con las salvaguardas que
 * motivaron el veto original — no se retira la protección, se implementa:
 *   - Autoplay se detiene en cualquier interacción del usuario (flechas,
 *     puntos, drag, teclado) y hay un botón visible de pausa/reanudar
 *     (WCAG 2.2.2 Pause, Stop, Hide) — ver `AnunciosCarousel.tsx`.
 *   - Si el usuario tiene `prefers-reduced-motion: reduce`, el autoplay
 *     arranca apagado y las transiciones se desactivan por completo.
 *   - Navegación completa por teclado (flechas) y por lectores de
 *     pantalla (`aria-roledescription`, región `aria-live` anunciando el
 *     anuncio activo).
 *   - El modal de detalle (`AnuncioModal.tsx`) atrapa el foco, cierra con
 *     Escape y navega con flechas sin perder el punto de foco previo.
 * Pendiente: reflejar este cambio en el artefacto de spec de SDD
 * (`sdd/anuncios-portal-citas/spec`) — no se encontró un archivo físico
 * local, vive en el backend de engram/openspec del proyecto.
 *
 * Fetch manual con `useEffect` + estado local — el portal NO usa TanStack
 * Query (mismo patrón que el resto de `HomePage.tsx`). Si la carga falla o
 * la lista viene vacía, no se renderiza nada: el banner nunca debe romper
 * el Home (caso límite "cero anuncios" del spec).
 */
export default function AnunciosBanner() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    let activo = true;
    listarAnunciosVigentes()
      .then((data) => {
        if (activo) setAnuncios(data);
      })
      .catch(() => {
        // No bloqueante: si falla la carga de anuncios, el banner
        // simplemente no se muestra (nunca debe romper el Home).
      });
    return () => {
      activo = false;
    };
  }, []);

  if (anuncios.length === 0) return null;

  return <AnunciosCarousel anuncios={anuncios} />;
}

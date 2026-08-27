import { useEffect, useRef, useState } from "react";

/**
 * Item minimo que el tracker necesita para detectar "algo cambio": un
 * identificador estable (`id`) y una marca de cambio (`changeKey`, tipicamente
 * un ISO 8601 tipo `fechaModf`) que el backend actualiza cada vez que la fila
 * se modifica. El tracker NO sabe nada de "visitas" ni de somatometria a
 * proposito -- vive en `shared/hooks` para poder reusarse en cualquier otra
 * cola/tablero que necesite el mismo badge de "Nuevo"/"Hace N min".
 */
export interface RelativeChangeTrackerItem {
  id: number;
  changeKey: string | null | undefined;
}

const TICK_INTERVAL_MS = 30_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Texto relativo -- SIEMPRE texto, nunca solo color (convencion de badges
 * ya usada en `SomatometriaQueueCards.tsx`). */
function formatRelativeLabel(changedAt: number, now: number): string {
  const diffMs = Math.max(0, now - changedAt);
  if (diffMs < MINUTE_MS) {
    return "Nuevo";
  }
  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return `Hace ${minutes} min`;
  }
  const hours = Math.floor(diffMs / HOUR_MS);
  return `Hace ${hours} h`;
}

/**
 * Trackea, 100% en el cliente, cuando cambio cada item de una lista (por
 * `changeKey`) y devuelve un texto relativo listo para mostrar en un badge.
 *
 * Reglas (ver Design D11 del change `somatometria-modulo-integral`):
 * - El PRIMER render de este hook SIEMPRE siembra el mapa de "visto" sin
 *   marcar nada como "recien cambiado" -- abrir la pantalla con la cola ya
 *   llena no debe mostrar "Nuevo" en todo. Desmontar el componente pierde el
 *   ref, asi que un remount vuelve a sembrar en silencio (nunca un falso
 *   "Nuevo").
 * - En renders SIGUIENTES, un `id` nuevo (recien aparecido en la lista) o un
 *   `id` cuyo `changeKey` cambio respecto al valor visto anteriormente,
 *   arranca su reloj de "recien cambiado" en `Date.now()`.
 * - Un `setInterval` de 30s fuerza un re-render para que el texto (
 *   "Nuevo" -> "Hace 1 min" -> "Hace 2 min" -> ... -> "Hace 1 h") envejezca
 *   solo, sin necesidad de que llegue ningun evento de realtime nuevo.
 */
export function useRelativeChangeTracker(
  items: RelativeChangeTrackerItem[],
): Map<number, string> {
  const seenRef = useRef<Map<number, string | null | undefined>>(new Map());
  const changedAtRef = useRef<Map<number, number>>(new Map());
  const isFirstRunRef = useRef(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const seen = seenRef.current;
    const changedAt = changedAtRef.current;
    const isFirstRun = isFirstRunRef.current;
    const idsPresentes = new Set<number>();
    let huboCambios = false;

    for (const item of items) {
      idsPresentes.add(item.id);
      const previamenteVisto = seen.has(item.id);
      const changeKeyAnterior = seen.get(item.id);

      if (isFirstRun) {
        seen.set(item.id, item.changeKey);
        continue;
      }

      const esNuevo = !previamenteVisto;
      const cambioDeValor =
        previamenteVisto && changeKeyAnterior !== item.changeKey;

      if (esNuevo || cambioDeValor) {
        changedAt.set(item.id, Date.now());
        huboCambios = true;
      }

      seen.set(item.id, item.changeKey);
    }

    // Limpieza: items que ya no estan en la lista no necesitan seguir
    // ocupando memoria (evita crecimiento sin limite en colas de larga vida).
    for (const id of seen.keys()) {
      if (!idsPresentes.has(id)) {
        seen.delete(id);
        changedAt.delete(id);
      }
    }

    isFirstRunRef.current = false;

    // El efecto muta refs (no state), asi que por si solo NO dispara un
    // re-render: sin este `setTick`, un id recien marcado como "Nuevo" no
    // se veria hasta el proximo tick del intervalo de 30s. Es seguro (no
    // entra en loop): las dependencias de este efecto son solo `[items]`,
    // que no cambia por actualizar `tick`.
    if (huboCambios) {
      setTick((tick) => tick + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const labels = new Map<number, string>();
  const now = Date.now();
  for (const [id, changedAt] of changedAtRef.current.entries()) {
    labels.set(id, formatRelativeLabel(changedAt, now));
  }
  return labels;
}

export default useRelativeChangeTracker;

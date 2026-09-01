import { useEffect, useState } from "react";
import { useServerClockStore } from "@app/state/ui/serverClockStore";

/**
 * Hora actual corregida con el offset del servidor, actualizada cada segundo.
 * El offset se sincroniza una vez por sesión desde el header `Date` de la
 * primera respuesta del backend (ver server-time.interceptor.ts).
 */
export function useServerClock(): Date {
  const offsetMs = useServerClockStore((state) => state.offsetMs);
  const [now, setNow] = useState(() => new Date(Date.now() + offsetMs));

  useEffect(() => {
    const tick = () => setNow(new Date(Date.now() + offsetMs));
    tick();

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [offsetMs]);

  return now;
}

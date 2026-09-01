/**
 * Server Time Interceptor
 *
 * Sincroniza el reloj de la app con el header `Date` que el servidor
 * ya envía en TODA respuesta HTTP (estándar RFC 7231, Django lo agrega solo).
 *
 * ¿POR QUÉ? Para que el reloj visible en el header (todas las pestañas)
 * no dependa del reloj del sistema operativo de cada doctor, que puede
 * estar desconfigurado. Se sincroniza una vez con la primera respuesta
 * del backend; de ahí en más el reloj tickea localmente sobre ese offset.
 */

import type { AxiosInstance } from "axios";
import { useServerClockStore } from "@app/state/ui/serverClockStore";

export function setupServerTimeInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use((response) => {
    const { isSynced, setOffset } = useServerClockStore.getState();

    if (!isSynced) {
      const serverDateHeader = response.headers?.date;
      const serverTimeMs = serverDateHeader
        ? Date.parse(serverDateHeader)
        : NaN;

      if (!Number.isNaN(serverTimeMs)) {
        setOffset(serverTimeMs);
      }
    }

    return response;
  });
}

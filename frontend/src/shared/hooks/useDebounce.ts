/**
 * useDebounce - Hook para retrasar la actualización de un valor
 *
 * USO TÍPICO: Búsqueda en tiempo real sin bombardear el servidor
 *
 * PATRÓN: Debouncing
 * - Espera X milisegundos después del último cambio antes de actualizar
 * - Si el valor cambia antes de que termine el delay, reinicia el timer
 *
 * EJEMPLO:
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 *
 * // Usuario escribe: "j" -> "ju" -> "jua" -> "juan"
 * // search cambia 4 veces inmediatamente
 * // debouncedSearch cambia SOLO 1 vez (300ms después de escribir "juan")
 *
 * useEffect(() => {
 *   // Este effect se ejecuta SOLO cuando termina de escribir
 *   fetchUsers(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 *
 * @param value - Valor a debouncear (ej: input del usuario)
 * @param delay - Milisegundos de espera (default: 500ms)
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Crear timer que actualizará el valor después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Si el valor cambia antes de que termine el delay, cancelar timer
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Re-export de sonner toast para compatibilidad con imports legacy
 *
 * Algunos componentes importan desde @/hooks/use-toast pero
 * el proyecto usa sonner directamente. Este archivo mantiene
 * compatibilidad.
 */

import { toast } from "sonner";

/**
 * Hook de compatibilidad - retorna el toast de sonner
 */
export function useToast() {
  return { toast };
}

export { toast };

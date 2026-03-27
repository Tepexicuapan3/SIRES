/**
 * ============================================
 * UTILITY: GENERADOR DE AVATARES
 * ============================================
 *
 * Genera avatares consistentes con iniciales y colores basados en el tema Metro CDMX.
 *
 * **Decisión de Diseño:**
 * - Usamos un hash del nombre completo para asignar un color de forma DETERMINÍSTICA
 * - Esto garantiza que el mismo usuario SIEMPRE tenga el mismo color
 * - La paleta usa colores de las líneas del Metro CDMX para identidad visual
 *
 * **Patrón Aplicado:**
 * - Pure function: mismo input → mismo output (testeable, predecible)
 * - Single Responsibility: solo genera avatares, no renderiza
 */

/**
 * Paleta de colores para avatares basada en tema Metro CDMX
 * Usamos las líneas del metro + colores clínicos para variedad visual
 */
const AVATAR_COLORS = [
  { bg: "#f04e98", text: "#ffffff" }, // Línea 1 - Rosa (Ginecología)
  { bg: "#007ac1", text: "#ffffff" }, // Línea 2 - Azul (Medicina General)
  { bg: "#b59b28", text: "#ffffff" }, // Línea 3 - Oliva (Geriatría)
  { bg: "#49c0b7", text: "#ffffff" }, // Línea 4 - Teal (Pediatría)
  { bg: "#3b82f6", text: "#ffffff" }, // Info - Azul clínico
  { bg: "#10b981", text: "#ffffff" }, // Stable - Verde esmeralda
  { bg: "#f59e0b", text: "#ffffff" }, // Alert - Ámbar
  { bg: "#fe5000", text: "#ffffff" }, // Brand - Naranja Metro
] as const;

/**
 * Extrae las iniciales de un nombre completo
 *
 * @example
 * extractInitials("Juan García López") → "JG"
 * extractInitials("María") → "M"
 * extractInitials("") → "?"
 *
 * **Lógica:**
 * 1. Tomamos primer nombre + primer apellido (más común en México)
 * 2. Si solo hay un nombre, usamos la primera letra
 * 3. Si el string está vacío, fallback a "?"
 */
function extractInitials(fullName: string): string {
  const trimmed = fullName.trim();

  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/); // Split por cualquier espacio

  if (parts.length === 1) {
    // Solo un nombre: usar primera letra
    return parts[0].charAt(0).toUpperCase();
  }

  // Dos o más partes: primer nombre + primer apellido
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
}

/**
 * Genera un hash numérico simple de un string
 *
 * **Algoritmo:**
 * - djb2 hash (simple, rápido, suficiente para nuestro caso)
 * - NO es criptográfico (no lo necesitamos, solo consistencia visual)
 *
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Selecciona un color de forma consistente basado en el nombre
 *
 * **Por qué hash en lugar de random:**
 * - random() → diferente en cada render (flicker visual)
 * - hash → mismo nombre SIEMPRE da mismo color (UX consistente)
 */
function selectColorForName(fullName: string): (typeof AVATAR_COLORS)[number] {
  const hash = hashString(fullName);
  const index = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Tipo de retorno del generador de avatares
 */
export interface AvatarData {
  /** Iniciales extraídas (ej: "JG", "M", "?") */
  initials: string;
  /** Color de fondo en formato hex (ej: "#f04e98") */
  backgroundColor: string;
  /** Color de texto en formato hex (siempre "#ffffff" por legibilidad) */
  textColor: string;
}

/**
 * Genera datos de avatar consistentes para un usuario
 *
 * @param fullName - Nombre completo del usuario (ej: "Juan García López")
 * @returns Objeto con iniciales y colores
 *
 * @example
 * const avatar = generateAvatar("Juan García López");
 * // → { initials: "JG", backgroundColor: "#f04e98", textColor: "#ffffff" }
 *
 * // Usar en componente:
 * <div style={{ backgroundColor: avatar.backgroundColor, color: avatar.textColor }}>
 *   {avatar.initials}
 * </div>
 */
export function generateAvatar(fullName: string): AvatarData {
  const initials = extractInitials(fullName);
  const color = selectColorForName(fullName);

  return {
    initials,
    backgroundColor: color.bg,
    textColor: color.text,
  };
}

/**
 * Variante para casos donde ya tenés las iniciales y solo necesitás el color
 *
 * @example
 * const color = getAvatarColorForName("Juan García");
 * // → { bg: "#f04e98", text: "#ffffff" }
 */
export function getAvatarColorForName(fullName: string): {
  bg: string;
  text: string;
} {
  const color = selectColorForName(fullName);
  return { bg: color.bg, text: color.text };
}

/**
 * Normaliza texto para busqueda tolerante: sin acentos/diacriticos, sin
 * mayusculas, sin espacios repetidos ni en las puntas. Con esto "areas"
 * encuentra "Áreas clínicas" y "  Turnos  " coincide con "turnos".
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Types for Clinicas API
 *
 * Catálogo de clínicas del Metro CDMX
 */

/**
 * Clínica entity
 *
 * Representa una clínica donde pueden ser asignados usuarios.
 * Retornado por GET /api/v1/clinicas
 */
export interface Clinica {
  id_clin: number; // Primary Key
  clinica: string; // Nombre de la clínica (ej: "CUAUHTÉMOC")
  folio_clin: string; // Código de la clínica (ej: "C")
}

/**
 * Permissions Types - Pure TypeScript interfaces
 * Tipos para catálogo de permisos del sistema.
 *
 * @description Interfaces para listar y mostrar permisos disponibles.
 * Los permisos son de solo lectura (no CRUD) y se ordenan por UI usando
 * la estructura del código "GRUPO:MODULO:SUBMODULO:ACCION".
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 */

// =============================================================================
// TIPOS COMUNES
// =============================================================================

/**
 * Efecto de un permiso override: permitir o denegar.
 * Usado en overrides de usuarios para modificar permisos heredados de roles.
 */
export type PermissionEffect = "ALLOW" | "DENY";

// =============================================================================
// ENTIDADES
// =============================================================================

/**
 * Permiso del sistema (estructura completa).
 * Representa un permiso en el catálogo.
 *
 * Los permisos se ordenan en la UI usando la estructura del código:
 * "GRUPO:MODULO:SUBMODULO:ACCION" (ej: "expedientes:create", "admin:gestion:usuarios:read")
 */
export interface Permission {
  id: number;
  code: string; // (ej: "GRUPO:MODULO:SUBMODULO:ACCION") 
  description: string;
  isSystem: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

/**
 * Response del catálogo de permisos.
 * GET /api/v1/permissions
 */
export interface PermissionCatalogResponse {
  items: Permission[];
  total: number;
}

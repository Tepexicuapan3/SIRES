/**
 * Barrel export - Permissions Components
 *
 * ARQUITECTURA MODULAR:
 * - PermissionsPage: Orquestador principal (Container)
 * - PermissionsList: Tabla de permisos con acciones CRUD (Presenter)
 * - PermissionForm: Formulario crear/editar con validación Zod (Presenter)
 *
 * IMPORTACIÓN:
 * import { PermissionsPage } from "@features/admin/components/permissions";
 */

export { PermissionsPage } from "./PermissionsPage";
export { PermissionsList } from "./PermissionsList";
export { PermissionForm } from "./PermissionForm";

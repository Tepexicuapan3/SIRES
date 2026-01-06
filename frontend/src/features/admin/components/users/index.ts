/**
 * Barrel export - Users Components
 *
 * ARQUITECTURA MODULAR:
 * - UsersPage: Orquestador principal (Container)
 * - UsersList: Tabla de usuarios con búsqueda (Presenter)
 * - UserRolesManager: Gestión de múltiples roles (Presenter)
 * - UserPermissionOverrides: Permisos excepcionales temporales (Presenter)
 *
 * IMPORTACIÓN:
 * import { UsersPage } from "@features/admin/components/users";
 */

export { UsersPage } from "./UsersPage";
export { UsersList } from "./UsersList";
export { UserRolesManager } from "./UserRolesManager";
export { UserPermissionOverrides } from "./UserPermissionOverrides";

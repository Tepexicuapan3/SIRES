/**
 * ============================================
 * EXPORTS - Componentes de Usuarios
 * ============================================
 *
 * Barrel export para facilitar imports de componentes relacionados.
 */

// Componentes principales (integración completa)
export { UsersPage } from "./UsersPage";
export { UsersTableToolbar } from "./UsersTableToolbar";
export { UsersDataTable } from "./UsersDataTable";

// Componentes base (primitivos reutilizables)
export { UserAvatar } from "./UserAvatar";
export { UserStatusBadge } from "./UserStatusBadge";
export { UserRoleBadge } from "./UserRoleBadge";
export { UsersTableSkeleton } from "./UsersTableSkeleton";
export { UsersTablePagination } from "./UsersTablePagination";
export { UsersTableRow } from "./UsersTableRow";

// Componentes legacy (mantener para compatibilidad)
export { UserDetailCard } from "./UserDetailCard";
export { UserRolesManager } from "./UserRolesManager";
export { UserPermissionOverrides } from "./UserPermissionOverrides";
export { UserFormDialog } from "./UserFormDialog";

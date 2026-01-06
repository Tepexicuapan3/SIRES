/**
 * Admin Hooks - Central Export
 *
 * Re-exporta todos los hooks de administración RBAC 2.0
 */

// Roles CRUD
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
  useRevokePermission,
} from "./useRoles";

// Permissions CRUD + User Overrides
export {
  usePermissionsCatalog,
  usePermissions,
  usePermission,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  useUserOverrides,
  useUserEffectivePermissions,
  useAddUserOverride,
  useRemoveUserOverride,
  useInvalidatePermissionsCache,
} from "./useAdminPermissions";

// User Multi-Role Management
export {
  useUserRoles,
  useAssignRoles,
  useSetPrimaryRole,
  useRevokeRole,
} from "./useAdminUsers";

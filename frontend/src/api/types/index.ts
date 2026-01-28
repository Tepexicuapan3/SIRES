/**
 * API Types - Barrel Export
 * Re-exports all API types from domain modules.
 *
 * @description Punto de entrada único para todos los tipos de la API SIRES.
 * Los tipos están organizados por dominio funcional.
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 */

// =============================================================================
// COMMON TYPES (pagination, responses)
// =============================================================================
export type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
  ErrorResponse,
} from "@api/types/common.types";

// =============================================================================
// AUTH TYPES (login, session, recovery)
// =============================================================================
export type {
  // Entidades
  AuthUser,
  // Requests
  LoginRequest,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  ResetPasswordRequest,
  CompleteOnboardingRequest,
  // Responses
  LoginResponse,
  RefreshTokenResponse,
  VerifyResetCodeResponse,
  VerifyTokenResponse,
  LogoutResponse,
  RequestResetCodeResponse,
  ResetPasswordResponse,
  CompleteOnboardingResponse,
  MeResponse,
} from "@api/types/auth.types";

// =============================================================================
// USERS TYPES (CRUD, roles assignment, overrides)
// =============================================================================
export type {
  // Objetos anidados (relaciones)
  UserRef,
  BaseUser,
  // Entidades
  UserListItem,
  UserDetail,
  UserRole,
  UserOverride,
  // CRUD Requests
  CreateUserRequest,
  UpdateUserRequest,
  // CRUD Responses
  CreateUserResponse,
  UpdateUserResponse,
  UserStatusResponse,
  // Listados
  UsersListParams,
  UsersListResponse,
  // Detalle
  UserDetailResponse,
  // Sub-recurso: Roles
  AssignRolesRequest,
  AssignRolesResponse,
  SetPrimaryRoleRequest,
  SetPrimaryRoleResponse,
  RevokeRoleResponse,
  // Sub-recurso: Overrides
  AddUserOverrideRequest,
  AddUserOverrideResponse,
  RemoveUserOverrideResponse,
} from "@api/types/users.types";

// =============================================================================
// ROLES TYPES (CRUD, permissions assignment)
// =============================================================================
export type {
  // Entidades
  RoleRef,
  RoleListItem,
  RoleDetail,
  RolePermission,
  // Requests
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  RevokePermissionsRequest,
  // Responses
  CreateRoleResponse,
  UpdateRoleResponse,
  DeleteRoleResponse,
  AssignPermissionsResponse,
  RevokePermissionsResponse,
  // Listados
  RolesListResponse,
  RolesListParams,
  // Detalle
  RoleDetailResponse,
} from "@api/types/roles.types";

// =============================================================================
// PERMISSIONS TYPES (catalog only - read-only)
// =============================================================================
export type {
  // Tipos comunes
  PermissionEffect,
  // Entidades
  Permission,
  // Responses
  PermissionCatalogResponse,
} from "@api/types/permissions.types";

// =============================================================================
// CLINICS TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  CentroAtencionRef,
  CentroAtencionListItem,
  CentroAtencionDetail,
  // CRUD Requests
  CreateCentroAtencionRequest,
  UpdateCentroAtencionRequest,
  // CRUD Responses
  CreateCentroAtencionResponse,
  UpdateCentroAtencionResponse,
  DeleteCentroAtencionResponse,
  // Listados
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
  // Detalle
  CentroAtencionDetailResponse,
} from "@api/types/catalogos/centros-atencion.types";

export type {
  // Entidades
  AreaRef,
  AreaListItem,
  AreaDetail,
  // CRUD Requests
  CreateAreaRequest,
  UpdateAreaRequest,
  // CRUD Responses
  CreateAreaResponse,
  UpdateAreaResponse,
  DeleteAreaResponse,
  // Listados
  AreasListParams,
  AreasListResponse,
  // Detalle
  AreaDetailResponse,
} from "@api/types/catalogos/areas.types";

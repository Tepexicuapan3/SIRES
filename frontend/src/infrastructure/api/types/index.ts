/**
 * API Types - Barrel Export
 * Re-exports all API types from domain modules.
 *
 * @description Punto de entrada único para todos los tipos de la API SISEM.
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
  AuthCapabilityState,
  AuthCapabilitiesResponse,
  // Requests
  LoginRequest,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  ResetPasswordRequest,
  CompleteOnboardingRequest,
  ChangePasswordRequest,
  // Responses
  LoginResponse,
  RefreshTokenResponse,
  VerifyResetCodeResponse,
  VerifyTokenResponse,
  LogoutResponse,
  RequestResetCodeResponse,
  ResetPasswordResponse,
  CompleteOnboardingResponse,
  ChangePasswordResponse,
  MeResponse,
  CapabilitiesResponse,
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
// =============================================================================
// CLINICS TYPES (CRUD + schedules + postal codes)
// =============================================================================
export type {
  // Refs y enums
  CentroAtencionRef,
  TurnoRef,
  DiaSemana,
  CentroAtencionType,
  TipoExcepcion,
  // Entidades - centro
  CentroAtencionListItem,
  CentroAtencionDetail,
  // CRUD Requests - centro
  CreateCentroAtencionRequest,
  UpdateCentroAtencionRequest,
  // CRUD Responses - centro
  CreateCentroAtencionResponse,
  UpdateCentroAtencionResponse,
  DeleteCentroAtencionResponse,
  // Listados - centro
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
  // Detalle - centro
  CentroAtencionDetailResponse,
  // Entidades - horario
  CentroAtencionHorarioListItem,
  CentroAtencionHorarioDetail,
  // CRUD Requests - horario
  CreateCentroAtencionHorarioRequest,
  UpdateCentroAtencionHorarioRequest,
  // CRUD Responses - horario
  CreateCentroAtencionHorarioResponse,
  UpdateCentroAtencionHorarioResponse,
  DeleteCentroAtencionHorarioResponse,
  // Listados - horario
  CentrosAtencionHorariosListParams,
  CentrosAtencionHorariosListResponse,
  // Detalle - horario
  CentroAtencionHorarioDetailResponse,
  // Entidades - excepcion
  CentroAtencionExcepcionListItem,
  CentroAtencionExcepcionDetail,
  // CRUD Requests - excepcion
  CreateCentroAtencionExcepcionRequest,
  UpdateCentroAtencionExcepcionRequest,
  // CRUD Responses - excepcion
  CreateCentroAtencionExcepcionResponse,
  UpdateCentroAtencionExcepcionResponse,
  DeleteCentroAtencionExcepcionResponse,
  // Listados - excepcion
  CentrosAtencionExcepcionesListParams,
  CentrosAtencionExcepcionesListResponse,
  // Detalle - excepcion
  CentroAtencionExcepcionDetailResponse,
  // Codigos postales
  PostalCodeSearchItem,
  PostalCodeSearchResponse,
} from "@api/types/catalogos/centros-atencion.types";

// =============================================================================
// TURNOS TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  TurnoListItem,
  TurnoDetail,
  // CRUD Requests
  CreateTurnoRequest,
  UpdateTurnoRequest,
  // CRUD Responses
  CreateTurnoResponse,
  UpdateTurnoResponse,
  DeleteTurnoResponse,
  // Listados
  TurnosListParams,
  TurnosListResponse,
  // Detalle
  TurnoDetailResponse,
} from "@api/types/catalogos/turnos.types";

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

export type {
  // Entidades
  ConsultorioRef,
  ConsultorioCatalogRef,
  ConsultorioListItem,
  ConsultorioDetail,
  // CRUD Requests
  CreateConsultorioRequest,
  UpdateConsultorioRequest,
  // CRUD Responses
  CreateConsultorioResponse,
  UpdateConsultorioResponse,
  DeleteConsultorioResponse,
  // Listados
  ConsultoriosListParams,
  ConsultoriosListResponse,
  // Detalle
  ConsultorioDetailResponse,
} from "@api/types/catalogos/consultorios.types";

// =============================================================================
// TIPOS DE AREAS TYPES (CRUD)
// =============================================================================
export type {
  TipoAreaListItem,
  TipoAreaDetail,
  CreateTipoAreaRequest,
  UpdateTipoAreaRequest,
  CreateTipoAreaResponse,
  UpdateTipoAreaResponse,
  DeleteTipoAreaResponse,
  TiposAreasListParams,
  TiposAreasListResponse,
  TipoAreaDetailResponse,
} from "@api/types/catalogos/tipos-areas.types";

// =============================================================================
// ESCOLARIDAD TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  EscolaridadListItem,
  EscolaridadDetail,
  // CRUD Requests
  CreateEscolaridadRequest,
  UpdateEscolaridadRequest,
  // CRUD Responses
  CreateEscolaridadResponse,
  UpdateEscolaridadResponse,
  DeleteEscolaridadResponse,
  // Listados
  EscolaridadListParams,
  EscolaridadListResponse,
  // Detalle
  EscolaridadDetailResponse,
} from "@api/types/catalogos/escolaridad.types";

// =============================================================================
// ESCUELAS TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  EscuelaListItem,
  EscuelaDetail,
  // CRUD Requests
  CreateEscuelaRequest,
  UpdateEscuelaRequest,
  // CRUD Responses
  CreateEscuelaResponse,
  UpdateEscuelaResponse,
  DeleteEscuelaResponse,
  // Listados
  EscuelasListParams,
  EscuelasListResponse,
  // Detalle
  EscuelaDetailResponse,
} from "@api/types/catalogos/escuelas.types";

// =============================================================================
// ESPECIALIDADES TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  EspecialidadListItem,
  EspecialidadDetail,
  // CRUD Requests
  CreateEspecialidadRequest,
  UpdateEspecialidadRequest,
  // CRUD Responses
  CreateEspecialidadResponse,
  UpdateEspecialidadResponse,
  DeleteEspecialidadResponse,
  // Listados
  EspecialidadesListParams,
  EspecialidadesListResponse,
  // Detalle
  EspecialidadDetailResponse,
} from "@api/types/catalogos/especialidades.types";

// =============================================================================
// VACUNAS TYPES (CRUD)
// =============================================================================
export type {
  // Entidades
  VacunaListItem,
  VacunaDetail,
  // CRUD Requests
  CreateVacunaRequest,
  UpdateVacunaRequest,
  // CRUD Responses
  CreateVacunaResponse,
  UpdateVacunaResponse,
  DeleteVacunaResponse,
  // Listados
  VacunasListParams,
  VacunasListResponse,
  // Detalle
  VacunaDetailResponse,
} from "@api/types/catalogos/vacunas.types";

// =============================================================================
// ÁREAS CLÍNICAS TYPES (CRUD catálogo + relación por centro)
// =============================================================================
export type {
  // Refs
  AreaClinicaRef,
  // Catálogo cat_areas_clinicas
  AreaClinicaListItem,
  AreaClinicaDetail,
  CreateAreaClinicaRequest,
  UpdateAreaClinicaRequest,
  AreasClinicasListResponse,
  AreaClinicaDetailResponse,
  CreateAreaClinicaResponse,
  UpdateAreaClinicaResponse,
  DeleteAreaClinicaResponse,
  AreasClinicasListParams,
  // Relación centro_area_clinica
  CentroAreaClinicaListItem,
  CentroAreaClinicaDetail,
  CreateCentroAreaClinicaRequest,
  UpdateCentroAreaClinicaRequest,
  CentrosAreasClinicasListResponse,
  CentroAreaClinicaDetailResponse,
  CreateCentroAreaClinicaResponse,
  UpdateCentroAreaClinicaResponse,
  DeleteCentroAreaClinicaResponse,
  CentrosAreasClinicasListParams,
} from "@api/types/catalogos/areas-clinicas.types";

// =============================================================================
// FARMACIA TYPES (inventario vacunas)
// =============================================================================
export type {
  VacunaRef,
  CentroRef,
  InventarioVacunaListItem,
  InventarioVacunaDetail,
  CreateInventarioVacunaRequest,
  UpdateInventarioVacunaRequest,
  InventarioVacunaListResponse,
  InventarioVacunaDetailResponse,
  CreateInventarioVacunaResponse,
  UpdateInventarioVacunaResponse,
  DeleteInventarioVacunaResponse,
  InventarioVacunaListParams,
  ApplyDosesRequest,
  ApplyDosesResponse,
} from "@api/types/farmacia/inventario-vacunas.types";

// =============================================================================
// CLINICAL FLOW TYPES (visits, vitals, doctor flow)
// =============================================================================
export type {
  ArrivalType,
  VisitService,
  VisitStatus,
  VisitQueueItem,
  VisitsListParams,
  VisitsListResponse,
  CreateVisitRequest,
  CreateVisitResponse,
  RecepcionStatusAction,
  UpdateVisitStatusRequest,
  UpdateVisitStatusResponse,
  CaptureVitalsRequest,
  CaptureVitalsResponse,
  VisitVitalsPayload,
  SaveDiagnosisRequest,
  SaveDiagnosisResponse,
  CieSearchParams,
  CieSearchItem,
  CieSearchResponse,
  SavePrescriptionRequest,
  SavePrescriptionResponse,
  StartConsultationResponse,
  VisitConsultationSummary,
  CloseVisitRequest,
  CloseVisitResponse,
} from "@api/types/visits.types";

export {
  ARRIVAL_TYPE,
  VISIT_SERVICE,
  VISIT_STATUS,
  RECEPCION_STATUS_ACTION,
} from "@api/types/visits.types";

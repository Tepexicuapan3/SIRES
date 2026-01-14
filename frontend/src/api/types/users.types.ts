/**
 * Types for Users API
 *
 * IMPORTANTE: Estos tipos usan la nomenclatura EXACTA del backend (MySQL).
 * NO hay mapeo intermedio - usamos los nombres de campos tal cual los retorna la API.
 *
 * Filosofía: Simplicidad > Abstracción innecesaria (menos bugs, menos código)
 */

/**
 * User entity - Nomenclatura del backend (MySQL)
 *
 * Representa un usuario del sistema con datos básicos.
 * Base común para AuthUser y User (CRUD).
 */
export interface BaseUser {
  id_usuario: number;
  usuario: string; // Username (ej: "jperez")
  nombre: string;
  paterno: string; // Apellido paterno
  materno: string; // Apellido materno
  expediente: string | null; // Número de expediente
  id_clin: number | null; // FK a cat_clinicas (puede ser NULL)
  correo: string;
  primary_role?: string; // Nombre del rol primario (ej: "MEDICO")
}

/**
 * User entity para CRUD (Listados y Detalle)
 * Extiende BaseUser con campos específicos de administración.
 *
 * Este tipo mapea 1:1 con la respuesta de GET /api/v1/users
 */
export interface User extends BaseUser {
  est_usuario: "A" | "B"; // A=Activo, B=Baja
  last_conexion: string | null; // Última sesión (timestamp)
}

/**
 * User con metadatos de auditoría
 *
 * Usado en vista detallada de usuario (GET /api/v1/users/:id)
 * Incluye información de quién creó/modificó el usuario
 */
export interface UserDetail extends User {
  usr_alta: number; // ID del usuario que lo creó
  fch_alta: string; // Fecha de alta
  usr_modf: number | null; // ID del usuario que lo modificó
  fch_modf: string | null; // Fecha de modificación
  terminos_acept: boolean; // Aceptó términos y condiciones
  cambiar_clave: boolean; // Debe cambiar contraseña
  ip_ultima: string | null; // IP de última conexión
}

/**
 * Request para crear usuario
 * POST /api/v1/users
 */
export interface CreateUserRequest {
  usuario: string;
  expediente: string;
  nombre: string;
  paterno: string;
  materno: string;
  id_clin: number | null; // FK a cat_clinicas (puede ser NULL)
  correo: string;
  id_rol: number; // Rol inicial a asignar
}

/**
 * Response al crear usuario
 * Incluye contraseña temporal que se muestra UNA SOLA VEZ
 */
export interface CreateUserResponse {
  message: string;
  user: {
    id_usuario: number;
    usuario: string;
    expediente: string;
    temp_password: string; // ⚠️ Mostrar al admin, no se puede recuperar después
    must_change_password: boolean;
    rol_asignado: number;
  };
}

/**
 * Request para actualizar usuario
 * PATCH /api/v1/users/:id
 *
 * Todos los campos opcionales - solo enviar los que se modifican
 */
export interface UpdateUserRequest {
  nombre?: string;
  paterno?: string;
  materno?: string;
  correo?: string;
  id_clin?: number | null; // FK a cat_clinicas
}

/**
 * User role assignment - Nomenclatura del backend
 *
 * CAMBIO IMPORTANTE vs versión anterior:
 * - Backend usa "rol" y "desc_rol" (NO "nombre" y "descripcion")
 * - Backend NO retorna "priority" en este endpoint
 *
 * Retornado por GET /api/v1/users/:id (lista de roles del usuario)
 */
export interface UserRole {
  id_rol: number;
  rol: string; // Nombre del rol (ej: "ADMIN", "MEDICO")
  desc_rol: string; // Descripción del rol
  is_primary: boolean; // TRUE si es el rol primario del usuario
}

/**
 * Request para asignar roles a usuario
 * POST /api/v1/users/:id/roles
 */
export interface AssignRolesRequest {
  role_ids: number[]; // Array de IDs de roles a asignar
  primary_role_id?: number; // Opcional: cuál marcar como primario
}

/**
 * Request para cambiar rol primario
 * PUT /api/v1/users/:id/roles/primary
 */
export interface SetPrimaryRoleRequest {
  role_id: number;
}

/**
 * Response al asignar/actualizar roles
 * Retorna roles actualizados del usuario
 */
export interface UserRolesResponse {
  user_id: number;
  roles: UserRole[];
  primary_role: UserRole;
}

/**
 * Response de GET /api/v1/users - Lista paginada
 *
 * IMPORTANTE: El backend retorna un objeto wrapper con metadata de paginación,
 * NO un array directo.
 */
export interface UsersListResponse {
  items: User[]; // Usuarios de la página actual
  page: number; // Página actual (1-indexed)
  page_size: number; // Registros por página
  total: number; // Total de usuarios (todas las páginas)
  total_pages: number; // Total de páginas
}

/**
 * Query params para GET /api/v1/users
 * Todos opcionales - permiten filtrado y paginación
 */
export interface UsersListParams {
  page?: number; // Default: 1
  page_size?: number; // Default: 20
  search?: string; // Búsqueda por texto (usuario, nombre, etc.)
  estado?: "A" | "B"; // Filtrar por estado (Activo/Baja)
  rol_id?: number; // Filtrar por rol
}

/**
 * Response de GET /api/v1/users/:id - Usuario detallado
 *
 * Incluye información completa del usuario + roles asignados
 */
export interface UserDetailResponse {
  user: UserDetail;
  roles: UserRole[];
}

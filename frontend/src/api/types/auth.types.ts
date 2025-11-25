/**
 * Types para el sistema de autenticación
 */

// ===== REQUEST TYPES =====
export interface LoginRequest {
  usuario: string;
  clave: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ===== RESPONSE TYPES =====
export interface Usuario {
  id_usuario: number;
  usuario: string;
  nombre: string;
  paterno: string;
  materno: string;
  nombre_completo: string; // Computed: nombre + paterno + materno
  expediente: string;
  curp: string;
  correo: string;
  ing_perfil: string;
  est_usuario: "A" | "I"; // A=Activo, I=Inactivo
  roles: string[]; // ['ROL', 'PERS', 'CC']
  permisos?: string[]; // Opcional: permisos específicos
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number; // Segundos hasta expiración
  user: Usuario;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

// ===== ERROR TYPES =====
export interface AuthError {
  message: string;
  code:
    | "INVALID_CREDENTIALS"
    | "USER_INACTIVE"
    | "USER_NOT_FOUND"
    | "TOKEN_EXPIRED";
}

// ===== STORE TYPES =====
export interface AuthState {
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

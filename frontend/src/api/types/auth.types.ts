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
  roles: string[]; // ['ROL', 'PERS', 'CC']
  permisos?: string[]; // Opcional: permisos específicos`
  must_change_password: boolean;
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
export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ===== STORE TYPES =====
export interface AuthState {
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Payload para pedir el código
export interface RequestResetCodeRequest {
  email: string;
}

// Payload para verificar el código OTP
export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

// Respuesta exitosa de verificación (recibes el token temporal)
export interface VerifyResetCodeResponse {
  valid: boolean;
  reset_token: string;
}

// Payload para cambiar la contraseña olvidada
export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

// Respuesta de reset password (ahora retorna LoginResponse con tokens)
export type ResetPasswordResponse = LoginResponse;

// Payload para el Onboarding (Primer Login)
export interface CompleteOnboardingRequest {
  new_password: string;
  terms_accepted: boolean;
}

export type CompleteOnboardingResponse = LoginResponse;

// ===== API INTERFACE =====
/**
 * Interfaz que define el contrato de la API de autenticación.
 * Tanto la implementación real como los mocks deben cumplir esta interfaz.
 */
export interface IAuthAPI {
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeOnboarding: (data: CompleteOnboardingRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: (refreshToken: string) => Promise<RefreshTokenResponse>;
  getCurrentUser: () => Promise<Usuario>;
  verifyToken: () => Promise<boolean>;
  requestResetCode: (data: RequestResetCodeRequest) => Promise<void>;
  verifyResetCode: (data: VerifyResetCodeRequest) => Promise<VerifyResetCodeResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
}

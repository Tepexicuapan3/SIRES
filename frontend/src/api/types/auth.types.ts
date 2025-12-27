/**
 * Types para el sistema de autenticación
 */

// ===== REQUEST TYPES =====
export interface LoginRequest {
  usuario: string;
  clave: string;
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

/**
 * Login Response
 * With HttpOnly cookies:
 * - Tokens are set via Set-Cookie header (not in body)
 * - Only user data and metadata in response body
 */
export interface LoginResponse {
  token_type?: "Bearer";
  expires_in?: number;
  user: Usuario;
  requires_onboarding?: boolean; // Flag for first-time users
}

export interface RefreshTokenResponse {
  token_type?: "Bearer";
  expires_in?: number;
}

// ===== ERROR TYPES =====
export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ===== STORE TYPES =====
// Note: With HttpOnly cookies, tokens are NOT stored client-side
export interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Removed: token and refreshToken - now in HttpOnly cookies
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

// Respuesta exitosa de verificación
// Note: reset_token set via HttpOnly cookie
export interface VerifyResetCodeResponse {
  valid: boolean;
}

// Payload para cambiar la contraseña olvidada
// Note: reset_token now comes from HttpOnly cookie, not request body
export interface ResetPasswordRequest {
  new_password: string;
  // Removed: reset_token - now in HttpOnly cookie
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
 *
 * Note: With HttpOnly cookies migration:
 * - Tokens are managed via cookies (Set-Cookie headers)
 * - No tokens in request/response bodies
 * - refreshToken() no longer needs a token parameter
 */
export interface IAuthAPI {
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeOnboarding: (
    data: CompleteOnboardingRequest,
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<RefreshTokenResponse>; // No param - token in cookie
  getCurrentUser: () => Promise<Usuario>;
  verifyToken: () => Promise<boolean>;
  requestResetCode: (data: RequestResetCodeRequest) => Promise<void>;
  verifyResetCode: (
    data: VerifyResetCodeRequest,
  ) => Promise<VerifyResetCodeResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
}

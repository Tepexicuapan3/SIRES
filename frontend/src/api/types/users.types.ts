/**
 * Types for Users API
 *
 * Contracts for user management
 */

export interface CreateUserRequest {
  usuario: string;
  expediente: string;
  nombre: string;
  paterno: string;
  materno: string;
  curp: string;
  correo: string;
  id_rol: number;
}

export interface CreateUserResponse {
  message: string;
  user: {
    id_usuario: number;
    usuario: string;
    expediente: string;
    temp_password: string;
    must_change_password: boolean;
    rol_asignado: number;
  };
}

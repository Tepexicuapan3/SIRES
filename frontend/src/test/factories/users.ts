import { faker } from "@faker-js/faker";
import type { AuthUser } from "@/api/types/auth.types";
import type { User, UserDetail, UserRole } from "@/api/types/users.types";

/**
 * Genera un usuario autenticado (AuthUser) para el contexto de Auth
 */
export const createMockAuthUser = (overrides: Partial<AuthUser> = {}): AuthUser => {
  const nombre = faker.person.firstName();
  const paterno = faker.person.lastName();
  const materno = faker.person.lastName();

  return {
    id_usuario: faker.number.int({ min: 1, max: 1000 }),
    usuario: faker.internet.username({ firstName: nombre, lastName: paterno }),
    nombre,
    paterno,
    materno,
    nombre_completo: `${nombre} ${paterno} ${materno}`,
    expediente: faker.string.numeric(8),
    id_clin: faker.number.int({ min: 1, max: 10 }),
    correo: faker.internet.email({ firstName: nombre, lastName: paterno }),
    ing_perfil: "Administrador",
    roles: ["ADMIN", "MEDICO"],
    permissions: ["*"], // Admin por defecto
    landing_route: "/admin",
    is_admin: true,
    must_change_password: false,
    ...overrides,
  };
};

/**
 * Genera un usuario para listas de administración (User)
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const nombre = faker.person.firstName();
  const paterno = faker.person.lastName();
  
  return {
    id_usuario: faker.number.int({ min: 1, max: 1000 }),
    usuario: faker.internet.username({ firstName: nombre, lastName: paterno }),
    nombre,
    paterno,
    materno: faker.person.lastName(),
    expediente: faker.string.numeric(8),
    id_clin: faker.number.int({ min: 1, max: 10 }),
    correo: faker.internet.email({ firstName: nombre, lastName: paterno }),
    est_usuario: faker.helpers.arrayElement(["A", "B"]), // Estado variado
    last_conexion: faker.date.recent().toISOString(),
    rol_primario: faker.helpers.arrayElement(["ADMINISTRADOR", "MEDICOS", "RECEPCION", "FARMACIA"]), // Rol variado
    ...overrides,
  };
};

/**
 * Genera un detalle de usuario completo (UserDetail)
 */
export const createMockUserDetail = (overrides: Partial<UserDetail> = {}): UserDetail => {
  const baseUser = createMockUser(overrides);
  
  return {
    ...baseUser,
    usr_alta: 1,
    fch_alta: faker.date.past().toISOString(),
    usr_modf: null,
    fch_modf: null,
    terminos_acept: true,
    cambiar_clave: false,
    ip_ultima: faker.internet.ipv4(),
    ...overrides,
  };
};

/**
 * Genera un rol de usuario (UserRole)
 */
export const createMockUserRole = (overrides: Partial<UserRole> = {}): UserRole => {
  return {
    id_rol: faker.number.int({ min: 1, max: 20 }),
    rol: "MEDICO",
    desc_rol: "Médico General",
    is_primary: false,
    ...overrides,
  };
};

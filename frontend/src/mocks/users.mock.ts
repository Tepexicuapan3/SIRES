/**
 * Mock Users para Testing RBAC 2.0
 *
 * Estos usuarios simulan la respuesta real de login del backend
 * con roles, permisos y landing routes según la configuración RBAC.
 *
 * IMPORTANTE:
 * - Passwords son solo para testing (NO usar en producción)
 * - Permisos basados en backend/migrations/004_rbac_assign_permissions.sql
 * - Roles SIN prefijo "ROL_" (ej: "ADMINISTRADOR", no "ROL_ADMINISTRADOR")
 *
 * USO:
 * 1. Para testing manual: usar credenciales de MOCK_CREDENTIALS
 * 2. Para mocks de API: importar MOCK_USERS_DB
 */

import type { Usuario, LoginResponse } from "@api/types/auth.types";

// ============================================================
// CREDENCIALES DE ACCESO (para login manual)
// ============================================================

export const MOCK_CREDENTIALS = {
  admin: {
    usuario: "admin",
    password: "Admin123!",
    descripcion: "Administrador del sistema - acceso total",
  },
  medico: {
    usuario: "dr.garcia",
    password: "Doc123!",
    descripcion: "Médico general - consultas y expedientes",
  },
  especialista: {
    usuario: "dra.lopez",
    password: "Esp123!",
    descripcion: "Médico especialista - acceso ampliado",
  },
  recepcion: {
    usuario: "recep01",
    password: "Recep123!",
    descripcion: "Recepcionista - citas y expedientes básicos",
  },
  farmacia: {
    usuario: "farm01",
    password: "Farm123!",
    descripcion: "Farmacéutico - dispensación de medicamentos",
  },
  urgencias: {
    usuario: "urg01",
    password: "Urg123!",
    descripcion: "Médico de urgencias - triage y atención inmediata",
  },
  hospital: {
    usuario: "coord.hosp",
    password: "Hosp123!",
    descripcion: "Coordinador hospitalario - admisión y facturación",
  },
  gerencia: {
    usuario: "gerente01",
    password: "Ger123!",
    descripcion: "Gerente - reportes y estadísticas",
  },
  jefatura: {
    usuario: "jefe.clinica",
    password: "Jefe123!",
    descripcion: "Jefe de clínica - supervisión médica",
  },
  trans_receta: {
    usuario: "trans01",
    password: "Trans123!",
    descripcion: "Transcriptor de recetas",
  },
} as const;

// ============================================================
// BASE DE DATOS MOCK DE USUARIOS
// ============================================================

export const MOCK_USERS_DB: Record<string, Usuario> = {
  // ========================================================
  // 1. ADMINISTRADOR (id_rol=22) - Acceso Total
  // ========================================================
  admin: {
    id_usuario: 1,
    usuario: "admin",
    nombre: "Administrador",
    paterno: "del",
    materno: "Sistema",
    nombre_completo: "Administrador del Sistema",
    expediente: "ADMIN001",
    curp: "ADMX000000HDFXXX00",
    correo: "admin@metro.cdmx.gob.mx",
    ing_perfil: "ADMINISTRADOR",
    roles: ["ADMINISTRADOR"],
    permissions: ["*"], // Wildcard - acceso a TODO
    must_change_password: false,
    landing_route: "/admin",
    is_admin: true,
  },

  // ========================================================
  // 2. MEDICOS (id_rol=1) - Consultas médicas
  // ========================================================
  "dr.garcia": {
    id_usuario: 2,
    usuario: "dr.garcia",
    nombre: "Juan Carlos",
    paterno: "García",
    materno: "Hernández",
    nombre_completo: "Juan Carlos García Hernández",
    expediente: "MED001",
    curp: "GAHJ850615HDFRRN01",
    correo: "jgarcia@metro.cdmx.gob.mx",
    ing_perfil: "MEDICOS",
    roles: ["MEDICOS"],
    permissions: [
      // Expedientes
      "expedientes:read",
      "expedientes:update",
      "expedientes:search",
      "expedientes:print",
      // Consultas
      "consultas:create",
      "consultas:read",
      "consultas:update",
      "consultas:sign",
      "consultas:export",
      // Recetas
      "recetas:create",
      "recetas:read",
      "recetas:print",
      // Citas
      "citas:read",
      // Laboratorio
      "laboratorio:create",
      "laboratorio:read",
      "laboratorio:print",
    ],
    must_change_password: false,
    landing_route: "/consultas",
    is_admin: false,
  },

  // ========================================================
  // 3. ESPECIALISTAS (id_rol=3) - Médico especialista
  // ========================================================
  "dra.lopez": {
    id_usuario: 3,
    usuario: "dra.lopez",
    nombre: "María Elena",
    paterno: "López",
    materno: "Ramírez",
    nombre_completo: "María Elena López Ramírez",
    expediente: "ESP001",
    curp: "LORM900420MDFRMS08",
    correo: "mlopez@metro.cdmx.gob.mx",
    ing_perfil: "ESPECIALISTAS",
    roles: ["ESPECIALISTAS"],
    permissions: [
      // Expedientes
      "expedientes:read",
      "expedientes:update",
      "expedientes:search",
      "expedientes:print",
      // Consultas (+ permiso adicional de leer consultas de otros)
      "consultas:create",
      "consultas:read",
      "consultas:update",
      "consultas:sign",
      "consultas:export",
      "consultas:read_others", // ← Adicional para especialistas
      // Recetas
      "recetas:create",
      "recetas:read",
      "recetas:print",
      // Citas
      "citas:read",
      // Laboratorio
      "laboratorio:create",
      "laboratorio:read",
      "laboratorio:print",
    ],
    must_change_password: false,
    landing_route: "/consultas",
    is_admin: false,
  },

  // ========================================================
  // 4. RECEPCION (id_rol=2) - Registro y citas
  // ========================================================
  recep01: {
    id_usuario: 4,
    usuario: "recep01",
    nombre: "Ana Laura",
    paterno: "Sánchez",
    materno: "Torres",
    nombre_completo: "Ana Laura Sánchez Torres",
    expediente: "RECEP001",
    curp: "SATA950310MDFRNN06",
    correo: "asanchez@metro.cdmx.gob.mx",
    ing_perfil: "RECEPCION",
    roles: ["RECEPCION"],
    permissions: [
      // Expedientes
      "expedientes:create",
      "expedientes:read",
      "expedientes:search",
      // Citas (permisos completos)
      "citas:create",
      "citas:read",
      "citas:update",
      "citas:delete",
      "citas:confirm",
      "citas:reschedule",
      "citas:export",
    ],
    must_change_password: false,
    landing_route: "/recepcion",
    is_admin: false,
  },

  // ========================================================
  // 5. FARMACIA (id_rol=7) - Dispensación de medicamentos
  // ========================================================
  farm01: {
    id_usuario: 5,
    usuario: "farm01",
    nombre: "Roberto",
    paterno: "Martínez",
    materno: "Flores",
    nombre_completo: "Roberto Martínez Flores",
    expediente: "FARM001",
    curp: "MAFR880715HDFRBL02",
    correo: "rmartinez@metro.cdmx.gob.mx",
    ing_perfil: "FARMACIA",
    roles: ["FARMACIA"],
    permissions: [
      // Recetas
      "recetas:read",
      "recetas:print",
      // Medicamentos
      "medicamentos:dispense",
      "medicamentos:read",
      "medicamentos:update_stock",
      // Expedientes (solo lectura)
      "expedientes:read",
      "expedientes:search",
    ],
    must_change_password: false,
    landing_route: "/farmacia",
    is_admin: false,
  },

  // ========================================================
  // 6. URGENCIAS (id_rol=6) - Atención de urgencias
  // ========================================================
  urg01: {
    id_usuario: 6,
    usuario: "urg01",
    nombre: "Carlos Alberto",
    paterno: "Ramírez",
    materno: "Soto",
    nombre_completo: "Carlos Alberto Ramírez Soto",
    expediente: "URG001",
    curp: "RASC870920HDFMTR05",
    correo: "cramirez@metro.cdmx.gob.mx",
    ing_perfil: "URGENCIAS",
    roles: ["URGENCIAS"],
    permissions: [
      // Expedientes
      "expedientes:read",
      "expedientes:update",
      "expedientes:search",
      // Urgencias (específico)
      "urgencias:create",
      "urgencias:read",
      "urgencias:update",
      "urgencias:triage", // ← Permiso de triage
      // Consultas
      "consultas:create",
      "consultas:read",
      "consultas:update",
      "consultas:sign",
      // Recetas
      "recetas:create",
      "recetas:read",
      // Laboratorio
      "laboratorio:create",
      "laboratorio:read",
    ],
    must_change_password: false,
    landing_route: "/urgencias",
    is_admin: false,
  },

  // ========================================================
  // 7. HOSP-COORDINACION (id_rol=14) - Hospital
  // ========================================================
  "coord.hosp": {
    id_usuario: 7,
    usuario: "coord.hosp",
    nombre: "Patricia",
    paterno: "Morales",
    materno: "Vega",
    nombre_completo: "Patricia Morales Vega",
    expediente: "HOSP001",
    curp: "MOVP820525MDFRGT09",
    correo: "pmorales@metro.cdmx.gob.mx",
    ing_perfil: "HOSP-COORDINACION",
    roles: ["HOSP-COORDINACION"],
    permissions: [
      // Expedientes
      "expedientes:read",
      "expedientes:search",
      // Hospital
      "hospital:coordinacion",
      "hospital:admision",
      // Reportes
      "reportes:hospital",
    ],
    must_change_password: false,
    landing_route: "/hospital",
    is_admin: false,
  },

  // ========================================================
  // 8. GERENCIA (id_rol=5) - Reportes y estadísticas
  // ========================================================
  gerente01: {
    id_usuario: 8,
    usuario: "gerente01",
    nombre: "Jorge Luis",
    paterno: "Fernández",
    materno: "Castro",
    nombre_completo: "Jorge Luis Fernández Castro",
    expediente: "GER001",
    curp: "FECJ750810HDFRSRG03",
    correo: "jfernandez@metro.cdmx.gob.mx",
    ing_perfil: "GERENCIA",
    roles: ["GERENCIA"],
    permissions: [
      // Reportes (todos)
      "reportes:consultas",
      "reportes:citas",
      "reportes:farmacia",
      "reportes:hospital",
      "reportes:export",
      // Auditoría
      "sistema:audit_logs",
      // Expedientes y consultas (lectura)
      "expedientes:read",
      "expedientes:search",
      "expedientes:export",
      "consultas:read",
      "consultas:export",
      // Usuarios (lectura)
      "usuarios:read",
    ],
    must_change_password: false,
    landing_route: "/reportes",
    is_admin: false,
  },

  // ========================================================
  // 9. JEFATURA CLINICA (id_rol=4) - Supervisión médica
  // ========================================================
  "jefe.clinica": {
    id_usuario: 9,
    usuario: "jefe.clinica",
    nombre: "Ricardo",
    paterno: "González",
    materno: "Pérez",
    nombre_completo: "Ricardo González Pérez",
    expediente: "JEF001",
    curp: "GOPR700615HDFNRC01",
    correo: "rgonzalez@metro.cdmx.gob.mx",
    ing_perfil: "JEFATURA CLINICA",
    roles: ["JEFATURA CLINICA"],
    permissions: [
      // Expedientes (completo)
      "expedientes:read",
      "expedientes:update",
      "expedientes:search",
      "expedientes:print",
      "expedientes:export",
      // Consultas (incluyendo de otros médicos)
      "consultas:create",
      "consultas:read",
      "consultas:update",
      "consultas:sign",
      "consultas:export",
      "consultas:read_others", // ← Supervisión
      // Recetas
      "recetas:create",
      "recetas:read",
      "recetas:print",
      // Citas
      "citas:read",
      // Laboratorio
      "laboratorio:create",
      "laboratorio:read",
      "laboratorio:print",
      // Reportes
      "reportes:consultas",
      "reportes:citas",
      "reportes:export",
    ],
    must_change_password: false,
    landing_route: "/consultas",
    is_admin: false,
  },

  // ========================================================
  // 10. TRANS-RECETA (id_rol=11) - Transcripción recetas
  // ========================================================
  trans01: {
    id_usuario: 10,
    usuario: "trans01",
    nombre: "Claudia",
    paterno: "Reyes",
    materno: "Mendoza",
    nombre_completo: "Claudia Reyes Mendoza",
    expediente: "TRANS001",
    curp: "REMC920405MDFRND04",
    correo: "creyes@metro.cdmx.gob.mx",
    ing_perfil: "TRANS-RECETA",
    roles: ["TRANS-RECETA"],
    permissions: [
      // Recetas (transcripción)
      "recetas:transcribe", // ← Permiso específico
      "recetas:read",
      "recetas:print",
      // Expedientes (solo lectura)
      "expedientes:read",
      "expedientes:search",
    ],
    must_change_password: false,
    landing_route: "/farmacia",
    is_admin: false,
  },
};

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Simula respuesta de login del backend
 */
export function mockLoginResponse(usuario: string): LoginResponse | null {
  const user = MOCK_USERS_DB[usuario];
  if (!user) return null;

  return {
    token_type: "Bearer",
    expires_in: 900, // 15 minutos (access token)
    user,
    requires_onboarding: false,
  };
}

/**
 * Valida credenciales mock
 */
export function validateMockCredentials(
  usuario: string,
  password: string,
): boolean {
  const credentials = Object.values(MOCK_CREDENTIALS).find(
    (c) => c.usuario === usuario,
  );
  return credentials?.password === password;
}

/**
 * Obtiene usuario por username
 */
export function getMockUser(usuario: string): Usuario | null {
  return MOCK_USERS_DB[usuario] || null;
}

/**
 * Lista todos los usuarios mock (para testing)
 */
export function listAllMockUsers(): Usuario[] {
  return Object.values(MOCK_USERS_DB);
}

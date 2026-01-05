/**
 * EJEMPLO DE USO - Mock Users
 *
 * Este archivo muestra ejemplos de cómo usar los mocks de usuarios
 * en diferentes contextos (testing, desarrollo, demos).
 *
 * NO importar este archivo en producción.
 */

import {
  MOCK_CREDENTIALS,
  mockLoginResponse,
  validateMockCredentials,
  getMockUser,
  listAllMockUsers,
} from "./index";

// ============================================================
// EJEMPLO 1: Validar credenciales en formulario de login
// ============================================================

function ejemploLoginValidation() {
  const usuario = "admin";
  const password = "Admin123!";

  // Validar credenciales
  if (validateMockCredentials(usuario, password)) {
    // Simular respuesta del backend
    const loginResponse = mockLoginResponse(usuario);
    console.log("Login exitoso:", loginResponse);

    // Guardar usuario en store (Zustand)
    // authStore.setUser(loginResponse.user);
  } else {
    console.error("Credenciales inválidas");
  }
}

// ============================================================
// EJEMPLO 2: Verificar permisos de un usuario
// ============================================================

function ejemploPermissionCheck() {
  const usuario = getMockUser("dr.garcia");

  if (!usuario) {
    console.error("Usuario no encontrado");
    return;
  }

  // Verificar si tiene permiso específico
  const canCreateConsultas = usuario.permissions.includes("consultas:create");
  console.log("Puede crear consultas:", canCreateConsultas); // true

  // Verificar si es admin (wildcard)
  const isAdmin = usuario.permissions.includes("*");
  console.log("Es administrador:", isAdmin); // false

  // Obtener landing route
  console.log("Landing route:", usuario.landing_route); // "/consultas"
}

// ============================================================
// EJEMPLO 3: Filtrar sidebar según permisos
// ============================================================

function ejemploSidebarFiltering() {
  const usuario = getMockUser("recep01");

  if (!usuario) return;

  // Definir items del sidebar (simplificado)
  const sidebarItems = [
    { title: "Administración", requiredPermission: "sistema:configurar" },
    { title: "Consultas", requiredPermission: "consultas:read" },
    { title: "Recepción", requiredPermission: "recepcion:registrar_paciente" },
    { title: "Expedientes", requiredPermission: "expedientes:read" },
  ];

  // Filtrar items visibles
  const visibleItems = sidebarItems.filter((item) => {
    // Admin bypass
    if (usuario.permissions.includes("*")) return true;

    // Check específico
    return usuario.permissions.includes(item.requiredPermission);
  });

  console.log("Items visibles para recep01:", visibleItems);
  // Resultado: Recepción, Expedientes (NO Administración, NO Consultas)
}

// ============================================================
// EJEMPLO 4: Testing de componentes con React Testing Library
// ============================================================

function ejemploComponentTesting() {
  // Mock para tests unitarios
  const mockUser = getMockUser("admin");

  // Simular contexto de autenticación
  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  };

  console.log("Mock auth context para tests:", mockAuthContext);
}

// ============================================================
// EJEMPLO 5: Listar todos los usuarios (para dropdown, etc.)
// ============================================================

function ejemploUserList() {
  const allUsers = listAllMockUsers();

  console.log(`Total de usuarios mock: ${allUsers.length}`);

  // Crear dropdown options
  const dropdownOptions = allUsers.map((user) => ({
    value: user.usuario,
    label: `${user.nombre_completo} (${user.roles[0]})`,
  }));

  console.log("Opciones de dropdown:", dropdownOptions);
}

// ============================================================
// EJEMPLO 6: Testing de diferentes roles en E2E
// ============================================================

function ejemploE2ETesting() {
  // Escenario 1: Admin ve todo
  const admin = mockLoginResponse("admin");
  console.assert(
    admin?.user.permissions.includes("*"),
    "Admin debe tener wildcard",
  );

  // Escenario 2: Médico puede crear consultas
  const medico = mockLoginResponse("dr.garcia");
  console.assert(
    medico?.user.permissions.includes("consultas:create"),
    "Médico debe poder crear consultas",
  );

  // Escenario 3: Recepcionista NO puede crear consultas
  const recepcion = mockLoginResponse("recep01");
  console.assert(
    !recepcion?.user.permissions.includes("consultas:create"),
    "Recepcionista NO debe poder crear consultas",
  );

  // Escenario 4: Gerente solo reportes
  const gerente = mockLoginResponse("gerente01");
  console.assert(
    gerente?.user.permissions.includes("reportes:consultas"),
    "Gerente debe poder ver reportes",
  );
  console.assert(
    !gerente?.user.permissions.includes("expedientes:create"),
    "Gerente NO debe poder crear expedientes",
  );

  console.log("Todos los tests E2E pasaron ✅");
}

// ============================================================
// EJEMPLO 7: Simular cambio de usuario en desarrollo
// ============================================================

function ejemploSwitchUser() {
  // Tabla de usuarios disponibles
  console.table(
    Object.keys(MOCK_CREDENTIALS).map((key) => ({
      Usuario: MOCK_CREDENTIALS[key as keyof typeof MOCK_CREDENTIALS].usuario,
      Password: MOCK_CREDENTIALS[key as keyof typeof MOCK_CREDENTIALS].password,
      Descripción:
        MOCK_CREDENTIALS[key as keyof typeof MOCK_CREDENTIALS].descripcion,
    })),
  );

  // Switch rápido de usuario (útil en dev)
  const switchToUser = (username: string) => {
    const response = mockLoginResponse(username);
    if (response) {
      console.log(`✅ Cambiado a usuario: ${response.user.nombre_completo}`);
      console.log(`   Rol: ${response.user.roles[0]}`);
      console.log(`   Landing: ${response.user.landing_route}`);
      // authStore.setUser(response.user);
    }
  };

  // Ejemplos de switch
  switchToUser("admin");
  switchToUser("dr.garcia");
  switchToUser("recep01");
}

// ============================================================
// EJECUTAR EJEMPLOS (descomentar para ver en consola)
// ============================================================

if (import.meta.env.DEV) {
  // Solo ejecutar en desarrollo
  console.log("====================================");
  console.log("🧪 MOCK USERS - EJEMPLOS DE USO");
  console.log("====================================\n");

  // Descomentar las funciones que quieras probar:
  // ejemploLoginValidation();
  // ejemploPermissionCheck();
  // ejemploSidebarFiltering();
  // ejemploComponentTesting();
  // ejemploUserList();
  // ejemploE2ETesting();
  // ejemploSwitchUser();
}

// ============================================================
// EXPORT (para usar en otros archivos de ejemplo)
// ============================================================

export {
  ejemploLoginValidation,
  ejemploPermissionCheck,
  ejemploSidebarFiltering,
  ejemploComponentTesting,
  ejemploUserList,
  ejemploE2ETesting,
  ejemploSwitchUser,
};

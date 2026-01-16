import { http, HttpResponse, delay } from "msw";
import { createMockUser, createMockUserDetail, createMockUserRole } from "../../factories/users";
import { createMockUserOverride, createMockPermission } from "../../factories/permissions";
import { getApiUrl } from "../urls";

// Base de datos de usuarios en memoria (100 usuarios)
// INYECTAMOS "PERSONAS" PARA TESTEO VISUAL DE UI/UX
let usersDB = [
  // 1. Caso Happy Path
  createMockUser({ 
    id_usuario: 1, 
    usuario: "jperez", 
    nombre: "JUAN", 
    paterno: "PEREZ", 
    rol_primario: "MEDICOS",
    est_usuario: "A"
  }),

  // 2. Caso Overflow de Texto (Nombres muy largos)
  createMockUser({ 
    id_usuario: 2, 
    usuario: "max_overflow", 
    nombre: "MAXIMILIANO DE LOS SANTOS", 
    paterno: "VON SCHWARZENBERG Y BORBÓN", 
    materno: "GUTIÉRREZ DE LA CONCEPCIÓN", 
    correo: "maximiliano.super.largo.email.corporativo.extremadamente.largo@metro.cdmx.gob.mx",
    rol_primario: "ADMINISTRADOR",
    est_usuario: "A"
  }),

  // 3. Caso Usuario Inactivo/Bloqueado
  createMockUser({ 
    id_usuario: 3, 
    usuario: "banned_user", 
    nombre: "ROBERTO", 
    paterno: "BLOQUEADO", 
    rol_primario: "RECEPCION",
    est_usuario: "B" // Inactivo
  }),

  // Rellenar el resto con datos aleatorios
  ...Array.from({ length: 97 }).map((_, i) => createMockUser({ id_usuario: i + 4 }))
];

// Usamos matchers permisivos para evitar problemas con baseURL
export const usersHandlers = [
  // Listar usuarios (Paginado y Filtrado Real)
  http.get(getApiUrl("users"), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("page_size") || 20);
    const search = url.searchParams.get("search")?.toLowerCase() || "";
    const rolId = url.searchParams.get("rol_id");
    const estado = url.searchParams.get("estado");

    // 1. Filtrado
    let filteredUsers = usersDB;

    if (search) {
      filteredUsers = filteredUsers.filter(u => 
        u.nombre.toLowerCase().includes(search) || 
        u.paterno.toLowerCase().includes(search) ||
        u.usuario.toLowerCase().includes(search)
      );
    }

    if (estado) {
      filteredUsers = filteredUsers.filter(u => u.est_usuario === estado);
    }

    if (rolId) {
      const roleMap: Record<string, string> = {
        "1": "ADMINISTRADOR",
        "2": "MEDICOS",
        "3": "RECEPCION",
        "4": "FARMACIA"
      };
      const targetRole = roleMap[rolId];
      if (targetRole) {
        filteredUsers = filteredUsers.filter(u => u.rol_primario === targetRole);
      }
    }

    // 2. Paginación
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    // Ordenar por ID descendente para ver los nuevos creados arriba
    const items = [...filteredUsers].sort((a, b) => b.id_usuario - a.id_usuario).slice(start, end);

    return HttpResponse.json({
      items,
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    });
  }),

  // Crear usuario (PERSISTENTE EN MEMORIA)
  http.post(getApiUrl("users"), async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;
    
    // Crear usuario con datos del form
    const newUser = createMockUser({
      id_usuario: usersDB.length + 1000, // ID alto para no colisionar
      usuario: body.usuario,
      nombre: body.nombre,
      paterno: body.paterno,
      materno: body.materno,
      correo: body.correo,
      expediente: body.expediente,
      id_clin: body.id_clin,
      // Asignar rol inicial (simulado)
      rol_primario: body.id_rol === "1" ? "ADMINISTRADOR" : "MEDICOS" 
    });

    // GUARDAR EN MEMORIA
    usersDB.unshift(newUser);
    
    return HttpResponse.json({
      message: "Usuario creado correctamente",
      user: {
        ...newUser,
        temp_password: "TempPassword123!",
        must_change_password: true,
        rol_asignado: body.id_rol
      }
    }, { status: 201 });
  }),

  // Detalle de usuario
  http.get(getApiUrl("users/:id"), ({ params }) => {
    const id = Number(params.id);
    const user = usersDB.find(u => u.id_usuario === id);
    
    if (!user) {
      return HttpResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const userDetail = createMockUserDetail({ ...user });
    const roles = [
        createMockUserRole({ is_primary: true, rol: user.rol_primario || "MEDICO" }), 
        createMockUserRole({ rol: "INVITADO", is_primary: false })
    ];

    return HttpResponse.json({
      user: userDetail,
      roles: roles
    });
  }),

  // Actualizar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id"), async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const body = await request.json() as any;

    const index = usersDB.findIndex(u => u.id_usuario === id);
    if (index !== -1) {
      usersDB[index] = { ...usersDB[index], ...body };
    }

    return HttpResponse.json({ message: "Usuario actualizado correctamente" });
  }),

  // Activar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id/activate"), async ({ params }) => {
    await delay(300);
    const id = Number(params.id);
    
    const index = usersDB.findIndex(u => u.id_usuario === id);
    if (index !== -1) {
      usersDB[index].est_usuario = "A";
    }

    return HttpResponse.json({ message: "Usuario activado" });
  }),

  // Desactivar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id/deactivate"), async ({ params }) => {
    await delay(300);
    const id = Number(params.id);

    const index = usersDB.findIndex(u => u.id_usuario === id);
    if (index !== -1) {
      usersDB[index].est_usuario = "B";
    }

    return HttpResponse.json({ message: "Usuario desactivado" });
  }),

  // --- GESTIÓN DE ROLES DEL USUARIO ---

  // Obtener roles (Redundante con detalle, pero por si se llama directo)
  http.get(getApiUrl("users/:id/roles"), async () => {
    await delay(200);
    const roles = [
        createMockUserRole({ is_primary: true }), 
        createMockUserRole({ rol: "MEDICO", is_primary: false })
    ];
    return HttpResponse.json({ roles });
  }),

  // Asignar roles
  http.post(getApiUrl("users/:id/roles"), async ({ params, request }) => {
    await delay(400);
    const userId = Number(params.id);
    const body = await request.json() as any;
    
    return HttpResponse.json({
      message: "Roles asignados correctamente",
      user_id: userId,
      assigned_count: body.role_ids?.length || 1,
      role_ids: body.role_ids
    }, { status: 201 });
  }),

  // Cambiar rol primario
  http.put(getApiUrl("users/:id/roles/primary"), async ({ params }) => {
    await delay(300);
    return HttpResponse.json({
      message: "Rol primario actualizado",
      user_id: Number(params.id),
      role_id: 1 // Dummy ID
    });
  }),

  // Revocar rol
  http.delete(getApiUrl("users/:id/roles/:roleId"), async ({ params }) => {
    await delay(300);
    const roleId = Number(params.roleId);
    
    // Simular error si es el último rol (opcional, para testear error handling)
    if (roleId === 999) {
        return HttpResponse.json({ code: "CANNOT_REVOKE_LAST_ROLE" }, { status: 400 });
    }

    return HttpResponse.json({
      message: "Rol revocado correctamente",
      user_id: Number(params.id),
      role_id: roleId,
      reassigned_primary: false
    });
  }),

  // --- GESTIÓN DE PERMISOS (OVERRIDES) ---

  // Obtener permisos efectivos + overrides
  http.get(getApiUrl("users/:id/permissions"), async ({ params }) => {
    await delay(300);
    const userId = Number(params.id);

    // --- ESCENARIOS VISUALES ESPECÍFICOS ---

    // ID 2: Usuario Overflow (Texto largo y muchos permisos)
    if (userId === 2) {
        return HttpResponse.json({
            user_id: userId,
            permissions: Array.from({ length: 50 }).map((_, i) => `permiso:relleno:${i}`), // 50 permisos
            is_admin: true,
            roles: [createMockUserRole({ is_primary: true })],
            landing_route: "/admin",
            overrides: [
                createMockUserOverride({ 
                    permission_code: "expedientes:delete",
                    permission_description: "Permiso crítico para borrar expedientes históricos del sistema centralizado con auditoría extendida y doble validación gerencial (Texto Largo)",
                    effect: "DENY"
                })
            ]
        });
    }

    // ID 3: Usuario con mezcla de estados (Expirados vs Activos)
    if (userId === 3) {
        return HttpResponse.json({
            user_id: userId,
            permissions: ["basico:read"],
            is_admin: false,
            roles: [createMockUserRole({ is_primary: true })],
            landing_route: "/recepcion",
            overrides: [
                createMockUserOverride({ permission_code: "activo:allow", effect: "ALLOW", is_expired: false }),
                createMockUserOverride({ permission_code: "expirado:deny", effect: "DENY", is_expired: true, expires_at: "2020-01-01" })
            ]
        });
    }

    // Default: Datos aleatorios
    const overrides = Array.from({ length: 3 }).map(() => createMockUserOverride());
    const permissions = Array.from({ length: 15 }).map(() => createMockPermission().code);

    return HttpResponse.json({
      user_id: userId,
      permissions, 
      is_admin: false,
      roles: [createMockUserRole({ is_primary: true })],
      landing_route: "/dashboard",
      overrides
    });
  }),

  // Agregar override
  http.post(getApiUrl("users/:id/permissions/override"), async ({ params, request }) => {
    await delay(300);
    const userId = Number(params.id);
    const body = await request.json() as any;

    const override = createMockUserOverride({
        permission_code: "permiso:mock", // En realidad vendría del ID
        effect: body.override_type
    });

    return HttpResponse.json(override, { status: 201 });
  }),

  // Eliminar override
  http.delete(getApiUrl("users/:id/permissions/override/:permissionId"), async () => {
    await delay(300);
    return HttpResponse.json({ message: "Override eliminado" });
  }),
];

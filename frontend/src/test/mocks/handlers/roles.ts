import { http, HttpResponse, delay } from "msw";
import { createMockRole, createMockRoleWithCount } from "../../factories/roles";
import { createMockPermission } from "../../factories/permissions";
import { getApiUrl } from "../urls";

// Base de datos en memoria para persistencia durante la sesión de test
// Esto permite que si creo un rol, luego aparezca en la lista
let rolesDB = Array.from({ length: 5 }).map((_, i) => 
  createMockRoleWithCount({ 
    id_rol: i + 1,
    // Los primeros 2 son de sistema, el resto usa el generador de la factory
    ...(i === 0 ? { rol: "ADMINISTRADOR" } : i === 1 ? { rol: "MEDICOS" } : {}),
    is_admin: i === 0 ? 1 : 0
  })
);

export const rolesHandlers = [
  // Listar roles
  http.get(getApiUrl("roles"), async () => {
    await delay(300);
    return HttpResponse.json({
      total: rolesDB.length,
      roles: rolesDB
    });
  }),

  // Detalle de rol
  http.get(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const role = rolesDB.find(r => r.id_rol === id);

    if (!role) {
      return HttpResponse.json({ code: "ROLE_NOT_FOUND", message: "Rol no encontrado" }, { status: 404 });
    }

    // Generar permisos aleatorios para este rol
    const permissions = Array.from({ length: role.permissions_count }).map(() => createMockPermission());

    return HttpResponse.json({
      role,
      permissions,
      permissions_count: permissions.length
    });
  }),

  // Crear rol
  http.post(getApiUrl("roles"), async ({ request }) => {
    await delay(400);
    const body = await request.json() as any;

    if (!body.rol || !body.desc_rol) {
      return HttpResponse.json({ code: "INVALID_REQUEST", message: "Faltan datos requeridos" }, { status: 400 });
    }

    const newRole = createMockRoleWithCount({
      ...body,
      id_rol: rolesDB.length + 100, // IDs nuevos altos
      permissions_count: 0,
      users_count: 0
    });

    rolesDB.push(newRole);

    return HttpResponse.json(newRole, { status: 201 });
  }),

  // Actualizar rol
  http.put(getApiUrl("roles/:id"), async ({ params, request }) => {
    await delay(400);
    const id = Number(params.id);
    
    // Simular protección de roles de sistema
    if (id <= 2) {
      return HttpResponse.json({ code: "ROLE_SYSTEM_PROTECTED", message: "No se puede modificar un rol de sistema" }, { status: 403 });
    }

    const roleIndex = rolesDB.findIndex(r => r.id_rol === id);
    if (roleIndex === -1) {
      return HttpResponse.json({ code: "ROLE_NOT_FOUND", message: "Rol no encontrado" }, { status: 404 });
    }

    const body = await request.json() as any;
    const updatedRole = { ...rolesDB[roleIndex], ...body };
    rolesDB[roleIndex] = updatedRole;

    return HttpResponse.json(updatedRole);
  }),

  // Eliminar rol
  http.delete(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(400);
    const id = Number(params.id);

    if (id <= 2) {
      return HttpResponse.json({ code: "ROLE_SYSTEM_PROTECTED", message: "No se puede eliminar un rol de sistema" }, { status: 403 });
    }

    const roleIndex = rolesDB.findIndex(r => r.id_rol === id);
    if (roleIndex === -1) {
      return HttpResponse.json({ code: "ROLE_NOT_FOUND", message: "Rol no encontrado" }, { status: 404 });
    }

    // Simular validación de usuarios asignados
    if (rolesDB[roleIndex].users_count > 0) {
      return HttpResponse.json({ code: "ROLE_HAS_USERS", message: "No se puede eliminar un rol con usuarios asignados" }, { status: 400 });
    }

    rolesDB = rolesDB.filter(r => r.id_rol !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Gestión de Permisos del Rol ---

  // Obtener permisos (alias de detalle)
  http.get(getApiUrl("roles/:id/permissions"), async ({ params }) => {
    const id = Number(params.id);
    const role = rolesDB.find(r => r.id_rol === id);
    if (!role) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    const permissions = Array.from({ length: 5 }).map(() => createMockPermission());
    
    return HttpResponse.json({
      role_id: id,
      total: permissions.length,
      permissions
    });
  }),

  // Asignar permiso
  http.post(getApiUrl("roles/:id/permissions"), async () => {
    await delay(200);
    return HttpResponse.json({ message: "Permiso asignado correctamente" });
  }),

  // Revocar permiso
  http.delete(getApiUrl("roles/:id/permissions/:permissionId"), async () => {
    await delay(200);
    return HttpResponse.json({ message: "Permiso revocado correctamente" });
  }),
];

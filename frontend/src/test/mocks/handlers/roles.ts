import { http, HttpResponse, delay } from "msw";
import {
  createMockRoleDetail,
  createMockRoleListItem,
  createMockRolePermission,
} from "../../factories/roles";
import { getApiUrl } from "../urls";

// Base de datos en memoria para persistencia durante la sesión de test
// Esto permite que si creo un rol, luego aparezca en la lista
let rolesDB = Array.from({ length: 5 }).map((_, i) =>
  createMockRoleListItem({
    id: i + 1,
    name: i === 0 ? "ADMINISTRADOR" : i === 1 ? "MEDICOS" : undefined,
    isSystem: i <= 1,
    isActive: true,
  }),
);

export const rolesHandlers = [
  // Listar roles
  http.get(getApiUrl("roles"), async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);
    const total = rolesDB.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = rolesDB.slice(start, end);

    return HttpResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  // Detalle de rol
  http.get(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const role = rolesDB.find((r) => r.id === id);

    if (!role) {
      return HttpResponse.json(
        { code: "ROLE_NOT_FOUND", message: "Rol no encontrado" },
        { status: 404 },
      );
    }

    const permissions = Array.from({ length: role.permissionsCount }).map(() =>
      createMockRolePermission(),
    );

    return HttpResponse.json({
      role: createMockRoleDetail(role),
      permissions,
    });
  }),

  // Crear rol
  http.post(getApiUrl("roles"), async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      landingRoute?: string;
    };

    if (!body.name || !body.description) {
      return HttpResponse.json(
        { code: "INVALID_REQUEST", message: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const newRole = createMockRoleListItem({
      id: rolesDB.length + 100,
      name: body.name,
      description: body.description,
      landingRoute: body.landingRoute ?? null,
      permissionsCount: 0,
      usersCount: 0,
    });

    rolesDB.push(newRole);

    return HttpResponse.json(
      { id: newRole.id, name: newRole.name },
      { status: 201 },
    );
  }),

  // Actualizar rol
  http.put(getApiUrl("roles/:id"), async ({ params, request }) => {
    await delay(400);
    const id = Number(params.id);

    const roleIndex = rolesDB.findIndex((r) => r.id === id);
    if (roleIndex === -1) {
      return HttpResponse.json(
        { code: "ROLE_NOT_FOUND", message: "Rol no encontrado" },
        { status: 404 },
      );
    }

    if (rolesDB[roleIndex].isSystem) {
      return HttpResponse.json(
        {
          code: "ROLE_SYSTEM_PROTECTED",
          message: "No se puede modificar un rol de sistema",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Partial<{
      name: string;
      description: string;
      landingRoute: string | null;
      isActive: boolean;
    }>;

    const updatedRole = {
      ...rolesDB[roleIndex],
      ...body,
    };
    rolesDB[roleIndex] = updatedRole;

    return HttpResponse.json({ role: createMockRoleDetail(updatedRole) });
  }),

  // Eliminar rol
  http.delete(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(400);
    const id = Number(params.id);

    const roleIndex = rolesDB.findIndex((r) => r.id === id);
    if (roleIndex === -1) {
      return HttpResponse.json(
        { code: "ROLE_NOT_FOUND", message: "Rol no encontrado" },
        { status: 404 },
      );
    }

    if (rolesDB[roleIndex].isSystem) {
      return HttpResponse.json(
        {
          code: "ROLE_SYSTEM_PROTECTED",
          message: "No se puede eliminar un rol de sistema",
        },
        { status: 403 },
      );
    }

    if (rolesDB[roleIndex].usersCount > 0) {
      return HttpResponse.json(
        {
          code: "ROLE_HAS_USERS",
          message: "No se puede eliminar un rol con usuarios asignados",
        },
        { status: 400 },
      );
    }

    rolesDB = rolesDB.filter((r) => r.id !== id);
    return HttpResponse.json({ success: true, message: "Rol eliminado" });
  }),
];

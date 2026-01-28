import { http, HttpResponse, delay } from "msw";
import {
  createMockUser,
  createMockUserDetail,
  createMockUserRole,
} from "../../factories/users";
import { createMockUserOverride } from "../../factories/permissions";
import { getApiUrl } from "../urls";
import type {
  AddUserOverrideRequest,
  AssignRolesRequest,
  CreateUserRequest,
  SetPrimaryRoleRequest,
  UpdateUserRequest,
} from "@/api/types/users.types";

// Base de datos de usuarios en memoria (100 usuarios)
// INYECTAMOS "PERSONAS" PARA TESTEO VISUAL DE UI/UX
const usersDB = [
  createMockUser({
    id: 1,
    username: "jperez",
    fullname: "JUAN PEREZ",
    email: "juan.perez@metro.cdmx.gob.mx",
    primaryRole: "MEDICOS",
    isActive: true,
  }),
  createMockUser({
    id: 2,
    username: "max_overflow",
    fullname: "MAXIMILIANO DE LOS SANTOS VON SCHWARZENBERG",
    email:
      "maximiliano.super.largo.email.corporativo.extremadamente.largo@metro.cdmx.gob.mx",
    primaryRole: "ADMINISTRADOR",
    isActive: true,
  }),
  createMockUser({
    id: 3,
    username: "banned_user",
    fullname: "ROBERTO BLOQUEADO",
    email: "banned_user@metro.cdmx.gob.mx",
    primaryRole: "RECEPCION",
    isActive: false,
  }),
  ...Array.from({ length: 97 }).map((_, i) => createMockUser({ id: i + 4 })),
];

// Usamos matchers permisivos para evitar problemas con baseURL
export const usersHandlers = [
  // Listar usuarios (Paginado y Filtrado Real)
  http.get(getApiUrl("users"), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(
      url.searchParams.get("pageSize") ||
        url.searchParams.get("page_size") ||
        20,
    );
    const search = url.searchParams.get("search")?.toLowerCase() || "";
    const roleId =
      url.searchParams.get("roleId") || url.searchParams.get("rol_id");
    const estado = url.searchParams.get("estado");
    const isActiveParam = url.searchParams.get("isActive");

    // 1. Filtrado
    let filteredUsers = usersDB;

    if (search) {
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.fullname.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search),
      );
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam === "true";
      filteredUsers = filteredUsers.filter((u) => u.isActive === isActive);
    } else if (estado) {
      const isActive = estado === "A";
      filteredUsers = filteredUsers.filter((u) => u.isActive === isActive);
    }

    if (roleId) {
      const roleMap: Record<string, string> = {
        "1": "ADMINISTRADOR",
        "2": "MEDICOS",
        "3": "RECEPCION",
        "4": "FARMACIA",
      };
      const targetRole = roleMap[roleId];
      if (targetRole) {
        filteredUsers = filteredUsers.filter(
          (u) => u.primaryRole === targetRole,
        );
      }
    }

    // 2. Paginación
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    // Ordenar por ID descendente para ver los nuevos creados arriba
    const items = [...filteredUsers]
      .sort((a, b) => b.id - a.id)
      .slice(start, end);

    return HttpResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  // Crear usuario (PERSISTENTE EN MEMORIA)
  http.post(getApiUrl("users"), async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as CreateUserRequest;

    const fullname = [body.firstName, body.paternalName, body.maternalName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const newUser = createMockUser({
      id: usersDB.length + 1000,
      username: body.username,
      fullname: fullname || body.username,
      email: body.email,
      clinic: body.clinicId
        ? { id: body.clinicId, name: "Centro de atencion" }
        : null,
      primaryRole: body.primaryRoleId === 1 ? "ADMINISTRADOR" : "MEDICOS",
      isActive: true,
    });

    // GUARDAR EN MEMORIA
    usersDB.unshift(newUser);

    return HttpResponse.json(
      {
        id: newUser.id,
        username: newUser.username,
        temporaryPassword: "TempPassword123!",
      },
      { status: 201 },
    );
  }),

  // Detalle de usuario
  http.get(getApiUrl("users/:id"), ({ params }) => {
    const id = Number(params.id);
    const user = usersDB.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const userDetail = createMockUserDetail({ ...user });
    const roles = [
      createMockUserRole({
        isPrimary: true,
        name: user.primaryRole || "MEDICO",
      }),
      createMockUserRole({ name: "INVITADO", isPrimary: false }),
    ];

    return HttpResponse.json({
      user: userDetail,
      roles,
      overrides: [],
    });
  }),

  // Actualizar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id"), async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const body = (await request.json()) as UpdateUserRequest;

    const index = usersDB.findIndex((u) => u.id === id);
    let updatedUser = usersDB[index];
    if (index !== -1) {
      usersDB[index] = { ...usersDB[index], ...body };
      updatedUser = usersDB[index];
    }

    return HttpResponse.json({
      user: createMockUserDetail({ ...updatedUser }),
    });
  }),

  // Activar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id/activate"), async ({ params }) => {
    await delay(300);
    const id = Number(params.id);

    const index = usersDB.findIndex((u) => u.id === id);
    if (index !== -1) {
      usersDB[index].isActive = true;
    }

    return HttpResponse.json({ id, isActive: true });
  }),

  // Desactivar usuario (PERSISTENTE EN MEMORIA)
  http.patch(getApiUrl("users/:id/deactivate"), async ({ params }) => {
    await delay(300);
    const id = Number(params.id);

    const index = usersDB.findIndex((u) => u.id === id);
    if (index !== -1) {
      usersDB[index].isActive = false;
    }

    return HttpResponse.json({ id, isActive: false });
  }),

  // --- GESTIÓN DE ROLES DEL USUARIO ---

  // Obtener roles (Redundante con detalle, pero por si se llama directo)
  http.get(getApiUrl("users/:id/roles"), async () => {
    await delay(200);
    const userId = 1;
    const roles = [
      createMockUserRole({ isPrimary: true, name: "MEDICO" }),
      createMockUserRole({ name: "INVITADO", isPrimary: false }),
    ];
    return HttpResponse.json({ userId, roles });
  }),

  // Asignar roles
  http.post(getApiUrl("users/:id/roles"), async ({ params, request }) => {
    await delay(400);
    const userId = Number(params.id);
    const body = (await request.json()) as AssignRolesRequest;

    const roles = (body.roleIds || []).map((roleId: number) =>
      createMockUserRole({ id: roleId, name: "ROL" }),
    );

    return HttpResponse.json(
      {
        userId,
        roles,
      },
      { status: 201 },
    );
  }),

  // Cambiar rol primario
  http.put(
    getApiUrl("users/:id/roles/primary"),
    async ({ params, request }) => {
      await delay(300);
      const userId = Number(params.id);
      const body = (await request.json()) as SetPrimaryRoleRequest;
      const roles = [
        createMockUserRole({ id: body.roleId, name: "ADMIN", isPrimary: true }),
        createMockUserRole({ id: 2, name: "MEDICO", isPrimary: false }),
      ];
      return HttpResponse.json({
        userId,
        roles,
      });
    },
  ),

  // Revocar rol
  http.delete(getApiUrl("users/:id/roles/:roleId"), async ({ params }) => {
    await delay(300);
    const userId = Number(params.id);
    const roleId = Number(params.roleId);

    // Simular error si es el último rol (opcional, para testear error handling)
    if (roleId === 999) {
      return HttpResponse.json(
        { code: "CANNOT_REVOKE_LAST_ROLE" },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      userId,
      roles: [createMockUserRole({ id: roleId, name: "ROL" })],
    });
  }),

  // --- GESTION DE OVERRIDES ---

  http.get(getApiUrl("users/:id/overrides"), async ({ params }) => {
    await delay(300);
    const userId = Number(params.id);
    const overrides = Array.from({ length: 3 }).map(() =>
      createMockUserOverride(),
    );

    return HttpResponse.json({
      userId,
      overrides,
    });
  }),

  http.post(getApiUrl("users/:id/overrides"), async ({ params, request }) => {
    await delay(300);
    const userId = Number(params.id);
    const body = (await request.json()) as AddUserOverrideRequest;

    const override = createMockUserOverride({
      permissionCode: body.permissionCode,
      effect: body.effect,
      expiresAt: body.expiresAt,
    });

    return HttpResponse.json({
      userId,
      overrides: [override],
    });
  }),

  http.delete(getApiUrl("users/:id/overrides/:code"), async ({ params }) => {
    await delay(300);
    return HttpResponse.json({
      userId: Number(params.id),
      overrides: [],
    });
  }),
];

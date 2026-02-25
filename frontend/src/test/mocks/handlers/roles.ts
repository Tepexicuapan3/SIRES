import { http, HttpResponse, delay } from "msw";
import {
  createMockRoleDetail,
  createMockRoleListItem,
  createMockRolePermission,
} from "../../factories/roles";
import { getApiUrl } from "../urls";
import { getMockSessionUser, hasMockPermission } from "../session";
import type { RoleListItem, RolePermission } from "@/api/types/roles.types";

const MOCK_DELAY = {
  list: 900,
  detail: 700,
  mutate: 550,
};

interface RoleSeed {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  landingRoute: string | null;
  usersCount: number;
}

const ROLE_SEEDS: RoleSeed[] = [
  {
    id: 1,
    name: "Admin",
    description: "Administrador del sistema",
    isSystem: true,
    landingRoute: "/admin/roles",
    usersCount: 5,
  },
  {
    id: 2,
    name: "Clinico",
    description: "Personal clinico",
    isSystem: true,
    landingRoute: "/clinico/consultas",
    usersCount: 24,
  },
  {
    id: 3,
    name: "Recepcion",
    description: "Personal de recepcion",
    isSystem: true,
    landingRoute: "/recepcion/agenda",
    usersCount: 17,
  },
  {
    id: 4,
    name: "Farmacia",
    description: "Personal de farmacia",
    isSystem: true,
    landingRoute: "/farmacia/recetas",
    usersCount: 12,
  },
  {
    id: 5,
    name: "Urgencias",
    description: "Personal de urgencias",
    isSystem: true,
    landingRoute: "/urgencias/triage",
    usersCount: 9,
  },
  {
    id: 6,
    name: "Auditoria",
    description: "Rol para auditoria operativa",
    isSystem: false,
    landingRoute: "/admin/reportes",
    usersCount: 2,
  },
  {
    id: 7,
    name: "Soporte",
    description: "Soporte funcional",
    isSystem: false,
    landingRoute: "/dashboard",
    usersCount: 1,
  },
];

const PERMISSION_CODE_POOL = [
  "admin:gestion:roles:read",
  "admin:gestion:roles:create",
  "admin:gestion:roles:update",
  "admin:gestion:roles:delete",
  "admin:gestion:usuarios:read",
  "admin:gestion:usuarios:update",
  "admin:gestion:permisos:read",
  "admin:reportes:read",
  "clinico:consultas:read",
  "recepcion:fichas:medicina_general:create",
] as const;

const createRolePermissions = (roleId: number, count: number) =>
  Array.from({ length: count }).map((_, index) => {
    const code = PERMISSION_CODE_POOL[index % PERMISSION_CODE_POOL.length];
    return createMockRolePermission({
      id: roleId * 100 + index + 1,
      code,
      description: `Permiso ${code}`,
    });
  });

const createInitialRoles = (): RoleListItem[] =>
  ROLE_SEEDS.map((seed) => {
    const permissionsCount = seed.isSystem ? 6 : 3;

    return createMockRoleListItem({
      id: seed.id,
      name: seed.name,
      description: seed.description,
      isSystem: seed.isSystem,
      isActive: true,
      landingRoute: seed.landingRoute,
      usersCount: seed.usersCount,
      permissionsCount,
    });
  });

const createInitialRolePermissions = (roles: RoleListItem[]) =>
  new Map<number, RolePermission[]>(
    roles.map((role) => [
      role.id,
      createRolePermissions(role.id, role.permissionsCount),
    ]),
  );

let rolesDB: RoleListItem[] = createInitialRoles();
let rolePermissionsDB = createInitialRolePermissions(rolesDB);

const updateRolePermissionCount = (roleId: number, nextCount: number) => {
  rolesDB = rolesDB.map((role) =>
    role.id === roleId
      ? {
          ...role,
          permissionsCount: nextCount,
        }
      : role,
  );
};

const requirePermission = (permission: string) => {
  const sessionUser = getMockSessionUser();

  if (!sessionUser) {
    return HttpResponse.json(
      {
        code: "SESSION_EXPIRED",
        message: "Debes iniciar sesion para realizar esta accion.",
      },
      { status: 401 },
    );
  }

  if (!hasMockPermission(permission)) {
    return HttpResponse.json(
      {
        code: "PERMISSION_DENIED",
        message: `No tienes permiso para realizar esta accion (${permission}).`,
      },
      { status: 403 },
    );
  }

  return null;
};

const parseBoolean = (value: string | null) => {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const compareValues = (
  first: RoleListItem,
  second: RoleListItem,
  sortBy: string,
) => {
  switch (sortBy) {
    case "name":
      return first.name.localeCompare(second.name);
    case "description":
      return first.description.localeCompare(second.description);
    case "permissionsCount":
      return first.permissionsCount - second.permissionsCount;
    case "usersCount":
      return first.usersCount - second.usersCount;
    case "isActive":
      return Number(first.isActive) - Number(second.isActive);
    case "isSystem":
      return Number(first.isSystem) - Number(second.isSystem);
    default:
      return first.name.localeCompare(second.name);
  }
};

export const roleExistsById = (roleId: number) =>
  rolesDB.some((role) => role.id === roleId);

export const getRoleById = (roleId: number) =>
  rolesDB.find((role) => role.id === roleId) ?? null;

export const getRolePermissions = (roleId: number) =>
  rolePermissionsDB.get(roleId) ?? [];

export const setRolePermissions = (
  roleId: number,
  permissions: RolePermission[],
) => {
  rolePermissionsDB.set(roleId, permissions);
  updateRolePermissionCount(roleId, permissions.length);
};

export const getAvailableRoles = () =>
  rolesDB.map((role) => ({
    id: role.id,
    name: role.name,
    isSystem: role.isSystem,
  }));

export const resetRolesMockState = () => {
  rolesDB = createInitialRoles();
  rolePermissionsDB = createInitialRolePermissions(rolesDB);
};

export const rolesHandlers = [
  http.get(getApiUrl("roles"), async ({ request }) => {
    await delay(MOCK_DELAY.list);
    const permissionError = requirePermission("admin:gestion:roles:read");
    if (permissionError) return permissionError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);
    const search = (url.searchParams.get("search") || "").toLowerCase().trim();
    const isActive = parseBoolean(url.searchParams.get("isActive"));
    const isSystem = parseBoolean(url.searchParams.get("isSystem"));
    const sortBy = (url.searchParams.get("sortBy") || "name").trim();
    const sortOrder =
      (url.searchParams.get("sortOrder") || "asc").toLowerCase() === "desc"
        ? "desc"
        : "asc";

    let filteredItems = [...rolesDB];

    if (search) {
      filteredItems = filteredItems.filter(
        (role) =>
          role.name.toLowerCase().includes(search) ||
          role.description.toLowerCase().includes(search),
      );
    }

    if (isActive !== undefined) {
      filteredItems = filteredItems.filter(
        (role) => role.isActive === isActive,
      );
    }

    if (isSystem !== undefined) {
      filteredItems = filteredItems.filter(
        (role) => role.isSystem === isSystem,
      );
    }

    filteredItems.sort((first, second) => {
      const comparison = compareValues(first, second, sortBy);
      return sortOrder === "desc" ? comparison * -1 : comparison;
    });

    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      items: filteredItems.slice(start, end),
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.detail);
    const permissionError = requirePermission("admin:gestion:roles:read");
    if (permissionError) return permissionError;

    const roleId = Number(params.id);
    const role = getRoleById(roleId);

    if (!role) {
      return HttpResponse.json(
        {
          code: "ROLE_NOT_FOUND",
          message: "El rol solicitado no existe.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      role: createMockRoleDetail(role),
      permissions: getRolePermissions(roleId),
    });
  }),

  http.post(getApiUrl("roles"), async ({ request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:gestion:roles:create");
    if (permissionError) return permissionError;

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      landingRoute?: string;
    };

    const details: Record<string, string[]> = {};
    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const landingRoute = body.landingRoute?.trim() || null;

    if (!name) {
      details.name = ["Nombre requerido"];
    }

    if (!description) {
      details.description = ["Descripcion requerida"];
    }

    if (landingRoute && landingRoute.length > 120) {
      details.landingRoute = ["La ruta no debe exceder 120 caracteres"];
    }

    if (Object.keys(details).length > 0) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
          details,
        },
        { status: 400 },
      );
    }

    const roleExists = rolesDB.some(
      (role) => role.name.toLowerCase() === name.toLowerCase(),
    );

    if (roleExists) {
      return HttpResponse.json(
        {
          code: "ROLE_EXISTS",
          message: "Ya existe un rol con ese nombre.",
        },
        { status: 409 },
      );
    }

    const roleId = Math.max(...rolesDB.map((role) => role.id)) + 1;
    const newRole = createMockRoleListItem({
      id: roleId,
      name,
      description,
      landingRoute,
      isSystem: false,
      isActive: true,
      usersCount: 0,
      permissionsCount: 0,
    });

    rolesDB = [newRole, ...rolesDB];
    setRolePermissions(roleId, []);

    return HttpResponse.json(
      {
        id: newRole.id,
        name: newRole.name,
      },
      { status: 201 },
    );
  }),

  http.put(getApiUrl("roles/:id"), async ({ params, request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:gestion:roles:update");
    if (permissionError) return permissionError;

    const roleId = Number(params.id);
    const roleIndex = rolesDB.findIndex((role) => role.id === roleId);

    if (roleIndex === -1) {
      return HttpResponse.json(
        {
          code: "ROLE_NOT_FOUND",
          message: "El rol solicitado no existe.",
        },
        { status: 404 },
      );
    }

    if (rolesDB[roleIndex].isSystem) {
      return HttpResponse.json(
        {
          code: "ROLE_SYSTEM_PROTECTED",
          message: "Los roles de sistema solo permiten lectura.",
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

    const details: Record<string, string[]> = {};

    const normalizedName = body.name?.trim();
    if (body.name !== undefined && !normalizedName) {
      details.name = ["Nombre requerido"];
    }

    if (body.description !== undefined && !body.description.trim()) {
      details.description = ["Descripcion requerida"];
    }

    if (body.landingRoute && body.landingRoute.length > 120) {
      details.landingRoute = ["La ruta no debe exceder 120 caracteres"];
    }

    if (Object.keys(details).length > 0) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
          details,
        },
        { status: 400 },
      );
    }

    if (normalizedName) {
      const duplicated = rolesDB.some(
        (role) =>
          role.id !== roleId &&
          role.name.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (duplicated) {
        return HttpResponse.json(
          {
            code: "ROLE_EXISTS",
            message: "Ya existe un rol con ese nombre.",
          },
          { status: 409 },
        );
      }
    }

    const updatedRole: RoleListItem = {
      ...rolesDB[roleIndex],
      ...(normalizedName ? { name: normalizedName } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim() }
        : {}),
      ...(body.landingRoute !== undefined
        ? { landingRoute: body.landingRoute?.trim() || null }
        : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    };

    rolesDB[roleIndex] = updatedRole;

    return HttpResponse.json({ role: createMockRoleDetail(updatedRole) });
  }),

  http.delete(getApiUrl("roles/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:gestion:roles:delete");
    if (permissionError) return permissionError;

    const roleId = Number(params.id);
    const role = getRoleById(roleId);

    if (!role) {
      return HttpResponse.json(
        {
          code: "ROLE_NOT_FOUND",
          message: "El rol solicitado no existe.",
        },
        { status: 404 },
      );
    }

    if (role.isSystem) {
      return HttpResponse.json(
        {
          code: "CANNOT_DELETE_SYSTEM_ROLE",
          message: "Los roles de sistema no se pueden eliminar.",
        },
        { status: 403 },
      );
    }

    if (role.usersCount > 0) {
      return HttpResponse.json(
        {
          code: "ROLE_HAS_USERS",
          message: "No se puede eliminar un rol con usuarios asignados.",
        },
        { status: 400 },
      );
    }

    rolesDB = rolesDB.filter((currentRole) => currentRole.id !== roleId);
    rolePermissionsDB.delete(roleId);

    return HttpResponse.json({ success: true, message: "Rol eliminado" });
  }),
];

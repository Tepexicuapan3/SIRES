import { http, HttpResponse, delay } from "msw";
import {
  createMockAreaDetail,
  createMockAreaListItem,
} from "../../factories/areas";
import { getMockSessionUser, hasMockPermission } from "../session";
import { getApiUrl } from "../urls";

const MOCK_DELAY = {
  list: 1000,
  detail: 700,
  mutate: 450,
};

export const areasDB = Array.from({ length: 12 }).map(() =>
  createMockAreaListItem(),
);

areasDB.unshift(
  createMockAreaListItem({
    id: 1,
    name: "Atencion Primaria",
    code: "ATP1",
    isActive: true,
  }),
);

let nextAreaId = Math.max(...areasDB.map((area) => area.id)) + 1;

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

export const areasHandlers = [
  http.get(getApiUrl("areas"), async ({ request }) => {
    await delay(MOCK_DELAY.list);
    const permissionError = requirePermission("admin:catalogos:areas:read");
    if (permissionError) return permissionError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    const isActiveParam = url.searchParams.get("isActive");

    const filteredAreas =
      isActiveParam === "true"
        ? areasDB.filter((area) => area.isActive)
        : isActiveParam === "false"
          ? areasDB.filter((area) => !area.isActive)
          : areasDB;

    const total = filteredAreas.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      items: filteredAreas.slice(start, end),
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get(getApiUrl("areas/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.detail);
    const permissionError = requirePermission("admin:catalogos:areas:read");
    if (permissionError) return permissionError;

    const areaId = Number(params.id);
    const area = areasDB.find((item) => item.id === areaId);

    if (!area) {
      return HttpResponse.json(
        {
          code: "AREA_NOT_FOUND",
          message: "Area no encontrada",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({ area: createMockAreaDetail(area) });
  }),

  http.post(getApiUrl("areas"), async ({ request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:catalogos:areas:create");
    if (permissionError) return permissionError;

    const body = (await request.json()) as { name?: string; code?: string };
    const name = body.name?.trim();
    const code = body.code?.trim().toUpperCase();

    if (!name || !code) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
          details: {
            name: !name ? ["Nombre requerido"] : [],
            code: !code ? ["Codigo requerido"] : [],
          },
        },
        { status: 400 },
      );
    }

    const duplicate = areasDB.some(
      (area) =>
        area.name.toLowerCase() === name.toLowerCase() ||
        area.code.toLowerCase() === code.toLowerCase(),
    );

    if (duplicate) {
      return HttpResponse.json(
        {
          code: "AREA_EXISTS",
          message: "Ya existe un area con ese nombre o codigo.",
        },
        { status: 409 },
      );
    }

    const createdArea = {
      id: nextAreaId,
      name,
      code,
      isActive: true,
    };

    nextAreaId += 1;
    areasDB.unshift(createdArea);

    return HttpResponse.json({ id: createdArea.id, name: createdArea.name });
  }),

  http.put(getApiUrl("areas/:id"), async ({ params, request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:catalogos:areas:update");
    if (permissionError) return permissionError;

    const areaId = Number(params.id);
    const areaIndex = areasDB.findIndex((item) => item.id === areaId);

    if (areaIndex === -1) {
      return HttpResponse.json(
        {
          code: "AREA_NOT_FOUND",
          message: "Area no encontrada",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      code?: string;
      isActive?: boolean;
    };

    const normalizedName = body.name?.trim();
    const normalizedCode = body.code?.trim().toUpperCase();

    const duplicate = areasDB.some((area) => {
      if (area.id === areaId) return false;
      const sameName =
        normalizedName &&
        area.name.toLowerCase() === normalizedName.toLowerCase();
      const sameCode =
        normalizedCode &&
        area.code.toLowerCase() === normalizedCode.toLowerCase();
      return Boolean(sameName || sameCode);
    });

    if (duplicate) {
      return HttpResponse.json(
        {
          code: "AREA_EXISTS",
          message: "Ya existe un area con ese nombre o codigo.",
        },
        { status: 409 },
      );
    }

    const currentArea = areasDB[areaIndex];
    const updatedArea = {
      ...currentArea,
      name: normalizedName ?? currentArea.name,
      code: normalizedCode ?? currentArea.code,
      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : currentArea.isActive,
    };

    areasDB[areaIndex] = updatedArea;

    return HttpResponse.json({
      area: createMockAreaDetail(updatedArea),
    });
  }),

  http.delete(getApiUrl("areas/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission("admin:catalogos:areas:delete");
    if (permissionError) return permissionError;

    const areaId = Number(params.id);
    const areaIndex = areasDB.findIndex((item) => item.id === areaId);

    if (areaIndex === -1) {
      return HttpResponse.json(
        {
          code: "AREA_NOT_FOUND",
          message: "Area no encontrada",
        },
        { status: 404 },
      );
    }

    areasDB.splice(areaIndex, 1);

    return HttpResponse.json({ success: true });
  }),
];

import { delay, http, HttpResponse } from "msw";
import {
  createMockConsultorioDetail,
  createMockConsultorioListItem,
} from "../../factories/consultorios";
import { getMockSessionUser, hasMockPermission } from "../session";
import { getApiUrl } from "../urls";

const MOCK_DELAY = {
  list: 1000,
  detail: 700,
  mutate: 450,
};

export const consultoriosDB = Array.from({ length: 10 }).map(() =>
  createMockConsultorioListItem(),
);

consultoriosDB.unshift(
  createMockConsultorioListItem({
    id: 1,
    name: "Consultorio General A1",
    code: 101,
    isActive: true,
  }),
);

let nextConsultorioId = Math.max(...consultoriosDB.map((item) => item.id)) + 1;

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

export const consultoriosHandlers = [
  http.get(getApiUrl("consulting-rooms"), async ({ request }) => {
    await delay(MOCK_DELAY.list);
    const permissionError = requirePermission(
      "admin:catalogos:consultorios:read",
    );
    if (permissionError) return permissionError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    const isActiveParam = url.searchParams.get("isActive");

    const filteredItems =
      isActiveParam === "true"
        ? consultoriosDB.filter((item) => item.isActive)
        : isActiveParam === "false"
          ? consultoriosDB.filter((item) => !item.isActive)
          : consultoriosDB;

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

  http.get(getApiUrl("consulting-rooms/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.detail);
    const permissionError = requirePermission(
      "admin:catalogos:consultorios:read",
    );
    if (permissionError) return permissionError;

    const consultorioId = Number(params.id);
    const consultorio = consultoriosDB.find(
      (item) => item.id === consultorioId,
    );

    if (!consultorio) {
      return HttpResponse.json(
        {
          code: "CONSULTING_ROOM_NOT_FOUND",
          message: "Consultorio no encontrado",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      consultingRoom: createMockConsultorioDetail(consultorio),
    });
  }),

  http.post(getApiUrl("consulting-rooms"), async ({ request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission(
      "admin:catalogos:consultorios:create",
    );
    if (permissionError) return permissionError;

    const body = (await request.json()) as {
      name?: string;
      code?: number;
      idTurn?: number;
      idCenter?: number;
      isActive?: boolean;
    };

    const name = body.name?.trim();
    const code = Number(body.code);
    const idTurn = Number(body.idTurn);
    const idCenter = Number(body.idCenter);

    if (!name || !Number.isFinite(code) || !idTurn || !idCenter) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
        },
        { status: 400 },
      );
    }

    const duplicate = consultoriosDB.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() || item.code === code,
    );

    if (duplicate) {
      return HttpResponse.json(
        {
          code: "CONSULTING_ROOM_EXISTS",
          message: "Ya existe un consultorio con ese nombre o codigo.",
        },
        { status: 409 },
      );
    }

    const createdItem = {
      id: nextConsultorioId,
      name,
      code,
      isActive: body.isActive ?? true,
    };

    nextConsultorioId += 1;
    consultoriosDB.unshift(createdItem);

    return HttpResponse.json({ id: createdItem.id, name: createdItem.name });
  }),

  http.put(getApiUrl("consulting-rooms/:id"), async ({ params, request }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission(
      "admin:catalogos:consultorios:update",
    );
    if (permissionError) return permissionError;

    const consultorioId = Number(params.id);
    const itemIndex = consultoriosDB.findIndex(
      (item) => item.id === consultorioId,
    );

    if (itemIndex === -1) {
      return HttpResponse.json(
        {
          code: "CONSULTING_ROOM_NOT_FOUND",
          message: "Consultorio no encontrado",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      code?: number;
      idTurn?: number;
      idCenter?: number;
      isActive?: boolean;
    };

    const normalizedName = body.name?.trim();
    const normalizedCode =
      typeof body.code === "number" && Number.isFinite(body.code)
        ? body.code
        : undefined;

    const duplicate = consultoriosDB.some((item) => {
      if (item.id === consultorioId) return false;
      const sameName =
        normalizedName &&
        item.name.toLowerCase() === normalizedName.toLowerCase();
      const sameCode =
        typeof normalizedCode === "number" && item.code === normalizedCode;
      return Boolean(sameName || sameCode);
    });

    if (duplicate) {
      return HttpResponse.json(
        {
          code: "CONSULTING_ROOM_EXISTS",
          message: "Ya existe un consultorio con ese nombre o codigo.",
        },
        { status: 409 },
      );
    }

    const currentItem = consultoriosDB[itemIndex];
    const updatedItem = {
      ...currentItem,
      name: normalizedName ?? currentItem.name,
      code: normalizedCode ?? currentItem.code,
      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : currentItem.isActive,
    };

    consultoriosDB[itemIndex] = updatedItem;

    return HttpResponse.json({
      consultingRoom: createMockConsultorioDetail(updatedItem),
    });
  }),

  http.delete(getApiUrl("consulting-rooms/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.mutate);
    const permissionError = requirePermission(
      "admin:catalogos:consultorios:delete",
    );
    if (permissionError) return permissionError;

    const consultorioId = Number(params.id);
    const itemIndex = consultoriosDB.findIndex(
      (item) => item.id === consultorioId,
    );

    if (itemIndex === -1) {
      return HttpResponse.json(
        {
          code: "CONSULTING_ROOM_NOT_FOUND",
          message: "Consultorio no encontrado",
        },
        { status: 404 },
      );
    }

    consultoriosDB.splice(itemIndex, 1);

    return HttpResponse.json({ success: true });
  }),
];

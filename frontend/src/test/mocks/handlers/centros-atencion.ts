import { http, HttpResponse, delay } from "msw";
import { createMockCentroAtencionDetail } from "../../factories/centros-atencion";
import { getMockSessionUser, hasMockPermission } from "../session";
import { getApiUrl } from "../urls";

const MOCK_DELAY = {
  list: 1000,
  detail: 700,
  mutate: 450,
};

export const centrosAtencionDB = Array.from({ length: 10 }).map(() =>
  createMockCentroAtencionDetail(),
);

centrosAtencionDB.unshift(
  createMockCentroAtencionDetail({
    id: 1,
    name: "Centro Central",
    folioCode: "CEN",
    isExternal: false,
    isActive: true,
    address: "Av. Central 100, CDMX",
    schedule: {
      morning: { startsAt: "07:00", endsAt: "14:00" },
      afternoon: { startsAt: "14:00", endsAt: "20:00" },
      night: { startsAt: "20:00", endsAt: "23:00" },
    },
  }),
);

let nextCenterId =
  Math.max(...centrosAtencionDB.map((center) => center.id)) + 1;

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

const toListItem = (center: (typeof centrosAtencionDB)[number]) => ({
  id: center.id,
  name: center.name,
  folioCode: center.folioCode,
  isExternal: center.isExternal,
  isActive: center.isActive,
});

const isValidTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidSchedule = (value: unknown) => {
  if (typeof value !== "object" || value === null) return false;

  const schedule = value as {
    morning?: { startsAt?: unknown; endsAt?: unknown };
    afternoon?: { startsAt?: unknown; endsAt?: unknown };
    night?: { startsAt?: unknown; endsAt?: unknown };
  };

  return (
    isValidTime(schedule.morning?.startsAt) &&
    isValidTime(schedule.morning?.endsAt) &&
    isValidTime(schedule.afternoon?.startsAt) &&
    isValidTime(schedule.afternoon?.endsAt) &&
    isValidTime(schedule.night?.startsAt) &&
    isValidTime(schedule.night?.endsAt)
  );
};

export const centrosAtencionHandlers = [
  http.get(getApiUrl("care-centers"), async ({ request }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:read",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.list);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    const isActiveParam = url.searchParams.get("isActive");
    const isExternalParam = url.searchParams.get("isExternal");

    const filteredCenters = centrosAtencionDB.filter((center) => {
      const statusMatches =
        isActiveParam === null
          ? true
          : center.isActive === (isActiveParam === "true");
      const typeMatches =
        isExternalParam === null
          ? true
          : center.isExternal === (isExternalParam === "true");
      return statusMatches && typeMatches;
    });

    const total = filteredCenters.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filteredCenters.slice(start, end).map(toListItem);

    return HttpResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get(getApiUrl("care-centers/:id"), async ({ params }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:read",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.detail);
    const id = Number(params.id);
    const center = centrosAtencionDB.find((item) => item.id === id);

    if (!center) {
      return HttpResponse.json(
        { code: "CLINIC_NOT_FOUND", message: "Centro no encontrado." },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      center,
    });
  }),

  http.post(getApiUrl("care-centers"), async ({ request }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:create",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.mutate);

    const body = (await request.json()) as {
      name?: string;
      folioCode?: string;
      isExternal?: boolean;
      address?: string;
      schedule?: unknown;
    };

    const name = body.name?.trim();
    const folioCode = body.folioCode?.trim().toUpperCase();
    const address = body.address?.trim();
    const isExternal = Boolean(body.isExternal);

    if (!name || !folioCode || !address || !isValidSchedule(body.schedule)) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
        },
        { status: 400 },
      );
    }

    const duplicateName = centrosAtencionDB.some(
      (center) => center.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicateName) {
      return HttpResponse.json(
        {
          code: "CLINIC_EXISTS",
          message: "Ya existe un centro con ese nombre.",
        },
        { status: 409 },
      );
    }

    const duplicateFolio = centrosAtencionDB.some(
      (center) => center.folioCode.toLowerCase() === folioCode.toLowerCase(),
    );
    if (duplicateFolio) {
      return HttpResponse.json(
        {
          code: "FOLIO_CODE_EXISTS",
          message: "El folio ya esta en uso por otro centro.",
        },
        { status: 409 },
      );
    }

    const sessionUser = getMockSessionUser();
    const schedule =
      body.schedule as (typeof centrosAtencionDB)[number]["schedule"];
    const createdCenter = createMockCentroAtencionDetail({
      id: nextCenterId,
      name,
      folioCode,
      isExternal,
      isActive: true,
      address,
      schedule,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: sessionUser?.id ?? 0,
        name: sessionUser?.fullName ?? "Sistema",
      },
      updatedAt: null,
      updatedBy: null,
    });

    nextCenterId += 1;
    centrosAtencionDB.unshift(createdCenter);

    return HttpResponse.json({
      id: createdCenter.id,
      name: createdCenter.name,
    });
  }),

  http.put(getApiUrl("care-centers/:id"), async ({ params, request }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:update",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.mutate);

    const id = Number(params.id);
    const centerIndex = centrosAtencionDB.findIndex((item) => item.id === id);

    if (centerIndex === -1) {
      return HttpResponse.json(
        { code: "CLINIC_NOT_FOUND", message: "Centro no encontrado." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      folioCode?: string;
      isExternal?: boolean;
      isActive?: boolean;
      address?: string;
      schedule?: unknown;
    };

    const normalizedName = body.name?.trim();
    const normalizedFolio = body.folioCode?.trim().toUpperCase();
    const normalizedAddress = body.address?.trim();

    const duplicateName = normalizedName
      ? centrosAtencionDB.some(
          (center) =>
            center.id !== id &&
            center.name.toLowerCase() === normalizedName.toLowerCase(),
        )
      : false;
    if (duplicateName) {
      return HttpResponse.json(
        {
          code: "CLINIC_EXISTS",
          message: "Ya existe un centro con ese nombre.",
        },
        { status: 409 },
      );
    }

    const duplicateFolio = normalizedFolio
      ? centrosAtencionDB.some(
          (center) =>
            center.id !== id &&
            center.folioCode.toLowerCase() === normalizedFolio.toLowerCase(),
        )
      : false;
    if (duplicateFolio) {
      return HttpResponse.json(
        {
          code: "FOLIO_CODE_EXISTS",
          message: "El folio ya esta en uso por otro centro.",
        },
        { status: 409 },
      );
    }

    if (body.schedule !== undefined && !isValidSchedule(body.schedule)) {
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos capturados.",
        },
        { status: 400 },
      );
    }

    const currentCenter = centrosAtencionDB[centerIndex];
    const sessionUser = getMockSessionUser();
    const nextSchedule =
      body.schedule !== undefined
        ? (body.schedule as typeof currentCenter.schedule)
        : currentCenter.schedule;

    const updatedCenter = {
      ...currentCenter,
      name: normalizedName ?? currentCenter.name,
      folioCode: normalizedFolio ?? currentCenter.folioCode,
      isExternal:
        typeof body.isExternal === "boolean"
          ? body.isExternal
          : currentCenter.isExternal,
      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : currentCenter.isActive,
      address: normalizedAddress ?? currentCenter.address,
      schedule: nextSchedule,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: sessionUser?.id ?? 0,
        name: sessionUser?.fullName ?? "Sistema",
      },
    };

    centrosAtencionDB[centerIndex] = updatedCenter;

    return HttpResponse.json({
      center: updatedCenter,
    });
  }),

  http.delete(getApiUrl("care-centers/:id"), async ({ params }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:delete",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.mutate);

    const id = Number(params.id);
    const centerIndex = centrosAtencionDB.findIndex((item) => item.id === id);

    if (centerIndex === -1) {
      return HttpResponse.json(
        { code: "CLINIC_NOT_FOUND", message: "Centro no encontrado." },
        { status: 404 },
      );
    }

    centrosAtencionDB.splice(centerIndex, 1);

    return HttpResponse.json({ success: true });
  }),
];

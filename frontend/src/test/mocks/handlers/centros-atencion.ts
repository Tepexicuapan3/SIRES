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
    code: "DFCEN001",
    legacyFolio: "CEN",
    centerType: "CLINICA",
    isExternal: false,
    isActive: true,
    address: "Av. Central 100, CDMX",
    postalCode: "06600",
    neighborhood: "Centro",
    municipality: "Cuauhtémoc",
    state: "Ciudad de México",
    city: "Ciudad de México",
    phone: "5555551234",
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
  code: center.code,
  centerType: center.centerType,
  legacyFolio: center.legacyFolio,
  isExternal: center.isExternal,
  isActive: center.isActive,
});

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
    const centerTypeParam = url.searchParams.get("centerType");

    const filteredCenters = centrosAtencionDB.filter((center) => {
      const statusMatches =
        isActiveParam === null
          ? true
          : center.isActive === (isActiveParam === "true");
      const typeMatches =
        isExternalParam === null
          ? true
          : center.isExternal === (isExternalParam === "true");
      const centerTypeMatches =
        centerTypeParam === null ? true : center.centerType === centerTypeParam;
      return statusMatches && typeMatches && centerTypeMatches;
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

    return HttpResponse.json({ careCenter: center });
  }),

  http.post(getApiUrl("care-centers"), async ({ request }) => {
    const permissionError = requirePermission(
      "admin:catalogos:centros_atencion:create",
    );
    if (permissionError) return permissionError;

    await delay(MOCK_DELAY.mutate);

    const body = (await request.json()) as {
      name?: string;
      code?: string;
      centerType?: string;
      legacyFolio?: string | null;
      isExternal?: boolean;
      address?: string | null;
      postalCode?: string | null;
      neighborhood?: string | null;
      municipality?: string | null;
      state?: string | null;
      city?: string | null;
      phone?: string | null;
      isActive?: boolean;
    };

    const name = body.name?.trim();
    const code = body.code?.trim().toUpperCase();

    if (!name || !code || !body.centerType) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Revisa los datos capturados." },
        { status: 400 },
      );
    }

    const duplicateCode = centrosAtencionDB.some(
      (center) => center.code.toLowerCase() === code.toLowerCase(),
    );
    if (duplicateCode) {
      return HttpResponse.json(
        { code: "CLUES_EXISTS", message: "El CLUES ya esta registrado." },
        { status: 409 },
      );
    }

    const sessionUser = getMockSessionUser();
    const createdCenter = createMockCentroAtencionDetail({
      id: nextCenterId,
      name,
      code,
      centerType: body.centerType as "CLINICA" | "HOSPITAL",
      legacyFolio: body.legacyFolio ?? null,
      isExternal: body.isExternal ?? false,
      isActive: body.isActive ?? true,
      address: body.address ?? null,
      postalCode: body.postalCode ?? null,
      neighborhood: body.neighborhood ?? null,
      municipality: body.municipality ?? null,
      state: body.state ?? null,
      city: body.city ?? null,
      phone: body.phone ?? null,
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

    return HttpResponse.json({ careCenter: createdCenter });
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
      code?: string;
      centerType?: string;
      legacyFolio?: string | null;
      isExternal?: boolean;
      isActive?: boolean;
      address?: string | null;
      postalCode?: string | null;
      neighborhood?: string | null;
      municipality?: string | null;
      state?: string | null;
      city?: string | null;
      phone?: string | null;
    };

    const normalizedCode = body.code?.trim().toUpperCase();

    if (normalizedCode) {
      const duplicateCode = centrosAtencionDB.some(
        (center) =>
          center.id !== id &&
          center.code.toLowerCase() === normalizedCode.toLowerCase(),
      );
      if (duplicateCode) {
        return HttpResponse.json(
          { code: "CLUES_EXISTS", message: "El CLUES ya esta registrado." },
          { status: 409 },
        );
      }
    }

    const currentCenter = centrosAtencionDB[centerIndex];
    const sessionUser = getMockSessionUser();

    const updatedCenter = {
      ...currentCenter,
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(normalizedCode !== undefined && { code: normalizedCode }),
      ...(body.centerType !== undefined && {
        centerType: body.centerType as "CLINICA" | "HOSPITAL",
      }),
      ...(body.legacyFolio !== undefined && { legacyFolio: body.legacyFolio }),
      ...(body.isExternal !== undefined && { isExternal: body.isExternal }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
      ...(body.neighborhood !== undefined && {
        neighborhood: body.neighborhood,
      }),
      ...(body.municipality !== undefined && {
        municipality: body.municipality,
      }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.phone !== undefined && { phone: body.phone }),
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: sessionUser?.id ?? 0,
        name: sessionUser?.fullName ?? "Sistema",
      },
    };

    centrosAtencionDB[centerIndex] = updatedCenter;

    return HttpResponse.json({ careCenter: updatedCenter });
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

    centrosAtencionDB[centerIndex] = {
      ...centrosAtencionDB[centerIndex],
      isActive: false,
    };

    return HttpResponse.json({ success: true });
  }),
];

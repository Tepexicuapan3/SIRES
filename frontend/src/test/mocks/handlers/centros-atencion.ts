import { http, HttpResponse, delay } from "msw";
import {
  createMockCentroAtencionDetail,
  createMockCentroAtencionListItem,
} from "../../factories/centros-atencion";
import { getApiUrl } from "../urls";

const centers = Array.from({ length: 10 }).map(() =>
  createMockCentroAtencionListItem(),
);

centers.unshift(
  createMockCentroAtencionListItem({
    id: 1,
    name: "CENTRO CENTRAL",
    folioCode: "CEN",
    isExternal: false,
    isActive: true,
  }),
);

export const centrosAtencionHandlers = [
  http.get(getApiUrl("care-centers"), async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);
    const total = centers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = centers.slice(start, end);

    return HttpResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get(getApiUrl("care-centers/:id"), async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const center = centers.find((item) => item.id === id);

    if (!center) {
      return HttpResponse.json(
        { code: "CLINIC_NOT_FOUND", message: "Centro no encontrado" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      center: createMockCentroAtencionDetail(center),
    });
  }),
];

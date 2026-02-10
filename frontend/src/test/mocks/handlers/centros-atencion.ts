import { http, HttpResponse, delay } from "msw";
import {
  createMockCentroAtencionDetail,
  createMockCentroAtencionListItem,
} from "../../factories/centros-atencion";
import { getApiUrl } from "../urls";

const MOCK_DELAY = {
  list: 1200,
  detail: 900,
};

export const centrosAtencionDB = Array.from({ length: 10 }).map(() =>
  createMockCentroAtencionListItem(),
);

centrosAtencionDB.unshift(
  createMockCentroAtencionListItem({
    id: 1,
    name: "Centro Central",
    folioCode: "CEN",
    isExternal: false,
    isActive: true,
  }),
);

export const centrosAtencionHandlers = [
  http.get(getApiUrl("care-centers"), async ({ request }) => {
    await delay(MOCK_DELAY.list);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 20);
    const total = centrosAtencionDB.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = centrosAtencionDB.slice(start, end);

    return HttpResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.get(getApiUrl("care-centers/:id"), async ({ params }) => {
    await delay(MOCK_DELAY.detail);
    const id = Number(params.id);
    const center = centrosAtencionDB.find((item) => item.id === id);

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

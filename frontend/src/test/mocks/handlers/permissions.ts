import { http, HttpResponse, delay } from "msw";
import { createMockPermission } from "../../factories/permissions";
import { getApiUrl } from "../urls";

const MOCK_DELAY = {
  list: 1200,
  detail: 700,
  mutate: 800,
};

export const permissionsHandlers = [
  // Listar todos los permisos (Catálogo)
  http.get(getApiUrl("permissions"), async () => {
    await delay(MOCK_DELAY.list);

    // Generamos un catálogo robusto
    const permissions = Array.from({ length: 20 }).map(() =>
      createMockPermission(),
    );

    return HttpResponse.json({
      items: permissions,
      total: permissions.length,
    });
  }),

  // Listar categorías
  http.get(getApiUrl("permissions/categories"), async () => {
    await delay(MOCK_DELAY.detail);
    return HttpResponse.json([
      "EXPEDIENTES",
      "USUARIOS",
      "REPORTES",
      "CONFIGURACION",
      "CONSULTAS",
    ]);
  }),

  // Asignar múltiples permisos a un rol
  http.post(getApiUrl("permissions/assign"), async ({ request }) => {
    await delay(MOCK_DELAY.mutate);
    const body = (await request.json()) as {
      roleId?: number;
      role_id?: number;
      permissionIds?: number[];
      permission_ids?: number[];
    };
    const permissionIds = body.permissionIds ?? body.permission_ids ?? [];

    const permissions = permissionIds.map((id) => createMockPermission({ id }));

    return HttpResponse.json({
      roleId: body.roleId ?? body.role_id ?? 0,
      permissions,
    });
  }),

  http.delete(
    getApiUrl("permissions/roles/:roleId/permissions/:permissionId"),
    async ({ params }) => {
      await delay(MOCK_DELAY.detail);
      const roleId = Number(params.roleId);
      return HttpResponse.json({ roleId, permissions: [] });
    },
  ),
];

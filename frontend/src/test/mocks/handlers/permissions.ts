import { http, HttpResponse, delay } from "msw";
import { createMockPermission } from "../../factories/permissions";
import { getApiUrl } from "../urls";

export const permissionsHandlers = [
  // Listar todos los permisos (Catálogo)
  http.get(getApiUrl("permissions"), async () => {
    await delay(300);

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
    await delay(100);
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
    await delay(200);
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
      await delay(200);
      const roleId = Number(params.roleId);
      return HttpResponse.json({ roleId, permissions: [] });
    },
  ),
];

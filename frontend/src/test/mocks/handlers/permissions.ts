import { http, HttpResponse, delay } from "msw";
import { createMockPermission } from "../../factories/permissions";
import { getApiUrl } from "../urls";

export const permissionsHandlers = [
  // Listar todos los permisos (Catálogo)
  http.get(getApiUrl("permissions"), async () => {
    await delay(300);
    
    // Generamos un catálogo robusto
    const permissions = Array.from({ length: 20 }).map(() => createMockPermission());
    
    return HttpResponse.json({
      total: permissions.length,
      permissions
    });
  }),

  // Listar categorías
  http.get(getApiUrl("permissions/categories"), async () => {
    await delay(100);
    return HttpResponse.json([
      "EXPEDIENTES", "USUARIOS", "REPORTES", "CONFIGURACION", "CONSULTAS"
    ]);
  }),

  // Asignar múltiples permisos a un rol
  http.post(getApiUrl("permissions/assign"), async ({ request }) => {
    await delay(200);
    const body = await request.json() as { role_id: number; permission_ids: number[] };
    
    return HttpResponse.json({
        message: "Permisos asignados exitosamente",
        role_id: body.role_id,
        assigned_count: body.permission_ids.length
    });
  }),
];

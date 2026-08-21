/**
 * Navigation API Resource
 *
 * Arbol de navegacion (sidebar/breadcrumbs/buscador) servido desde
 * `cat_modulos`, ya filtrado por permisos efectivos del usuario.
 */

import apiClient from "@api/client";
import type {
  CreateModuleRequest,
  CreateModuleResponse,
  ModuleCatalogListParams,
  ModuleCatalogResponse,
  NavigationMenuResponse,
  ReorderModulesRequest,
  ReorderModulesResponse,
  SetModuleVisibilityRequest,
  SetModuleVisibilityResponse,
  UpdateModuleRequest,
  UpdateModuleResponse,
} from "@api/types/navigation.types";

export const navigationAPI = {
  /**
   * Obtiene el arbol de navegacion filtrado por permisos.
   *
   * @endpoint GET /api/v1/navigation-menu
   * @permission Cualquier usuario autenticado (el filtrado por permisos
   * ES el contenido de la respuesta, no hay un permiso de acceso separado)
   *
   * Con el feature flag backend en `static`, responde
   * `{ source: "static", sections: [], secondaryItems: [] }` -- el
   * consumidor (`useNavigationMenu`/`useNavigation`) es responsable de
   * caer al fallback local (`NAV_CONFIG`) en ese caso.
   */
  getMenu: async (): Promise<NavigationMenuResponse> => {
    const response =
      await apiClient.get<NavigationMenuResponse>("/navigation-menu");
    return response.data;
  },

  /**
   * Obtiene el catalogo COMPLETO de modulos (arbol plano, todos los nodos del seed), sin
   * filtrar por permisos del actor ni podar contenedores vacios.
   *
   * @endpoint GET /api/v1/modules
   * @permission `admin:gestion:roles:read` por defecto; con
   * `includeInactive: true` exige `admin:gestion:modulos:read` (mas
   * especifico -- lo usa la pantalla de gestion de menus para poder
   * restaurar nodos ocultos, ver `ModuleCatalogView`).
   */
  getModuleCatalog: async (
    params?: ModuleCatalogListParams,
  ): Promise<ModuleCatalogResponse> => {
    const response = await apiClient.get<ModuleCatalogResponse>("/modules", {
      params: params?.includeInactive ? { includeInactive: 1 } : undefined,
    });
    return response.data;
  },

  /**
   * Crea un modulo nuevo. La `clave` NUNCA se envia -- el backend la
   * deriva del titulo + padre (autoridad de la unicidad).
   *
   * @endpoint POST /api/v1/modules
   * @permission `admin:gestion:modulos:create` + CSRF
   */
  createModule: async (
    data: CreateModuleRequest,
  ): Promise<CreateModuleResponse> => {
    const response = await apiClient.post<CreateModuleResponse>(
      "/modules",
      data,
    );
    return response.data;
  },

  /**
   * Actualiza campos simples de un modulo. Si el payload trae `parentKey`
   * (incluso `null`), el backend ADEMAS mueve el nodo de padre en la misma
   * transaccion -- ver `UpdateModuleView`.
   *
   * @endpoint PATCH /api/v1/modules/{clave}
   * @permission `admin:gestion:modulos:update` + CSRF
   */
  updateModule: async (
    clave: string,
    data: UpdateModuleRequest,
  ): Promise<UpdateModuleResponse> => {
    const response = await apiClient.patch<UpdateModuleResponse>(
      `/modules/${encodeURIComponent(clave)}`,
      data,
    );
    return response.data;
  },

  /**
   * Oculta (`isActive: false`) o restaura (`isActive: true`) un modulo.
   * Ocultar es SIEMPRE soft delete -- nunca hay un DELETE real.
   *
   * @endpoint PATCH /api/v1/modules/{clave}/visibility
   * @permission `admin:gestion:modulos:delete` + CSRF
   */
  setModuleVisibility: async (
    clave: string,
    data: SetModuleVisibilityRequest,
  ): Promise<SetModuleVisibilityResponse> => {
    const response = await apiClient.patch<SetModuleVisibilityResponse>(
      `/modules/${encodeURIComponent(clave)}/visibility`,
      data,
    );
    return response.data;
  },

  /**
   * Renumera TODO el grupo de hermanos de `parentKey` (10, 20, 30...).
   * `orderedKeys` debe coincidir EXACTAMENTE con los hermanos activos
   * actuales de ese padre.
   *
   * @endpoint PATCH /api/v1/modules/reorder
   * @permission `admin:gestion:modulos:update` + CSRF
   */
  reorderModules: async (
    data: ReorderModulesRequest,
  ): Promise<ReorderModulesResponse> => {
    const response = await apiClient.patch<ReorderModulesResponse>(
      "/modules/reorder",
      data,
    );
    return response.data;
  },
};

import type { RouteObject } from "react-router-dom";

/**
 * Derivacion pura de `MenuDestination[]` a partir de arboles `RouteObject[]`
 * ya evaluados (React elements reales, no AST).
 *
 * Razon industria:
 * - Vive en `scripts/` (fuera de `src/`) a proposito: es tooling de
 *   generacion/verificacion, nunca debe entrar al grafo de modulos de la
 *   app. `gen-menu-destinations.ts` la usa desde Node (via Vite SSR module
 *   loading) y `menu-destinations.test.ts` la usa desde Vitest (via import
 *   ESM normal) — ambos le pasan `RouteObject[]` ya resueltos, por eso este
 *   modulo no sabe nada de Vite ni de Node.
 * - Se detecta `<ProtectedRoute>` por NOMBRE de componente (`.name`), no por
 *   identidad de referencia: el script y el test cargan los `*.routes.config.tsx`
 *   por mecanismos distintos (ssrLoadModule vs import ESM de Vitest), asi que
 *   no comparten el mismo objeto de modulo para `ProtectedRoute`.
 */

export interface MenuDestination {
  path: string;
  permissions: string[];
  capability?: string;
}

export interface RouteModuleInput {
  /** Arbol de rutas ya evaluado (export de un `*.routes.config.tsx`). */
  routes: RouteObject[];
  /** Prefijo real montado en `Routes.tsx` (p.ej. "/admin"). */
  prefix: string;
}

interface ReactElementLike {
  type?: unknown;
  props?: Record<string, unknown>;
}

// Limite de profundidad para buscar <ProtectedRoute> entre wrappers
// (Suspense, helpers locales tipo `wrap()`). En el codigo actual
// ProtectedRoute siempre es el wrapper mas externo (profundidad 0), pero se
// deja margen por robustez ante wrappers intermedios futuros.
const MAX_WRAPPER_DEPTH = 6;

function isReactElementLike(value: unknown): value is ReactElementLike {
  return typeof value === "object" && value !== null && "props" in value;
}

function getComponentName(type: unknown): string | undefined {
  if (typeof type === "function") {
    const fn = type as { name?: string; displayName?: string };
    return fn.displayName ?? fn.name ?? undefined;
  }
  if (typeof type === "object" && type !== null) {
    const named = type as { displayName?: string; name?: string };
    return named.displayName ?? named.name;
  }
  return undefined;
}

function findProtectedRouteProps(
  element: unknown,
  depth = 0,
): Record<string, unknown> | undefined {
  if (depth > MAX_WRAPPER_DEPTH || !isReactElementLike(element)) {
    return undefined;
  }
  if (getComponentName(element.type) === "ProtectedRoute") {
    return element.props ?? {};
  }
  const children = element.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findProtectedRouteProps(child, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  return findProtectedRouteProps(children, depth + 1);
}

function extractPermissions(props: Record<string, unknown>): {
  permissions: string[];
  capability?: string;
} {
  const capability =
    typeof props.requiredCapability === "string"
      ? props.requiredCapability
      : undefined;

  if (typeof props.requiredPermission === "string") {
    return { permissions: [props.requiredPermission], capability };
  }

  const fallback = props.fallbackRequirement as
    | { allOf?: unknown; anyOf?: unknown }
    | undefined;
  if (Array.isArray(fallback?.allOf)) {
    return { permissions: [...(fallback.allOf as string[])], capability };
  }
  if (Array.isArray(fallback?.anyOf)) {
    return { permissions: [...(fallback.anyOf as string[])], capability };
  }

  if (Array.isArray(props.requiredAllPermissions)) {
    return {
      permissions: [...(props.requiredAllPermissions as string[])],
      capability,
    };
  }
  if (Array.isArray(props.requiredAnyPermissions)) {
    return {
      permissions: [...(props.requiredAnyPermissions as string[])],
      capability,
    };
  }

  // ProtectedRoute presente pero sin requisito de permiso explicito
  // (solo exige sesion autenticada) -> destino "unmanaged".
  return { permissions: [], capability };
}

function joinPath(prefix: string, segment?: string): string {
  if (!segment) return prefix;
  const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return `${cleanPrefix}/${segment}`;
}

/** Un path es "linkeable" desde un menu solo si es estatico. */
function isStaticDestination(fullPath: string): boolean {
  return fullPath
    .split("/")
    .every((segment) => segment === "" || (!segment.startsWith(":") && segment !== "*"));
}

function walkRoutes(
  routes: RouteObject[],
  prefix: string,
  out: Map<string, MenuDestination>,
): void {
  for (const route of routes) {
    const fullPath = joinPath(prefix, route.path);

    if (route.element !== undefined && route.element !== null) {
      const rootType = isReactElementLike(route.element)
        ? route.element.type
        : undefined;
      const isRedirect = getComponentName(rootType) === "Navigate";

      if (!isRedirect && isStaticDestination(fullPath)) {
        const protectedProps = findProtectedRouteProps(route.element);
        const { permissions, capability } = protectedProps
          ? extractPermissions(protectedProps)
          : { permissions: [] as string[], capability: undefined };
        out.set(fullPath, { path: fullPath, permissions, capability });
      }
    }

    if (route.children?.length) {
      walkRoutes(route.children, fullPath, out);
    }
  }
}

/**
 * Deriva `MenuDestination[]` de los arboles de rutas ya evaluados.
 *
 * Excluye:
 * - Redirects puros (`<Navigate />` como elemento raiz de la entrada).
 * - Paths dinamicos (segmentos `:param`) y catch-all (`*`): no son
 *   linkeables desde un menu fijo.
 * - "Carpetas" (rutas que solo agrupan `children`, sin `element` propio).
 */
export function deriveMenuDestinations(
  inputs: RouteModuleInput[],
): MenuDestination[] {
  const out = new Map<string, MenuDestination>();
  for (const { routes, prefix } of inputs) {
    walkRoutes(routes, prefix, out);
  }
  return [...out.values()].sort((a, b) => a.path.localeCompare(b.path));
}

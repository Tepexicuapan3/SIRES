import { describe, expect, it } from "vitest";
import { adminRoutes } from "@routes/modules/admin.routes.config";
import { clinicoRoutes } from "@routes/modules/clinico.routes.config";
import { recepcionRoutes } from "@routes/modules/recepcion.routes.config";
import { farmaciaRoutes } from "@routes/modules/farmacia.routes.config";
import { almacenRoutes } from "@routes/modules/almacen.routes.config";
import { serviciosRoutes } from "@routes/modules/servicios.routes.config";
import { coreRoutes } from "@routes/modules/core.routes.config";
import { urgenciasRoutes } from "@routes/modules/placeholders.routes.config";
import {
  deriveMenuDestinations,
  type RouteModuleInput,
} from "../../../../scripts/menu-destinations.derive";
import { MENU_DESTINATIONS } from "@app/navigation/menu-destinations.generated";
import { MENU_DESTINATION_LABELS } from "@app/navigation/menu-destinations.labels";

/**
 * Anti-drift de `menu-destinations.generated.ts`.
 *
 * Razon industria:
 * - Importa los `*.routes.config.tsx` como los importa la app de verdad
 *   (ESM normal, resuelto por el mismo Vite/alias que usa Vitest) y vuelve
 *   a correr la MISMA derivacion pura (`deriveMenuDestinations`, compartida
 *   con `gen-menu-destinations.ts`) para comparar contra lo que quedo
 *   commiteado. Si alguien agrega/cambia una ruta protegida y se olvida de
 *   correr `pnpm run gen:menu-destinations`, este test rompe el CI en vez
 *   de dejar el selector de destinos desincronizado en silencio.
 * - El segundo test es el otro lado del guardrail: un path derivado sin
 *   label a mano tambien rompe CI (en vez de aparecer sin nombre en
 *   `MenuDestinationSelect`, Fase 5).
 */

const ROUTE_MODULE_INPUTS: RouteModuleInput[] = [
  { routes: adminRoutes, prefix: "/admin" },
  { routes: clinicoRoutes, prefix: "/clinico" },
  { routes: recepcionRoutes, prefix: "/recepcion" },
  { routes: farmaciaRoutes, prefix: "/farmacia" },
  { routes: almacenRoutes, prefix: "/almacen" },
  { routes: serviciosRoutes, prefix: "/servicios" },
  { routes: coreRoutes, prefix: "/dashboard" },
  { routes: urgenciasRoutes, prefix: "/urgencias" },
];

describe("menu-destinations.generated.ts (anti-drift)", () => {
  it("coincide con correr la derivacion en vivo de nuevo sobre las rutas reales", () => {
    const live = deriveMenuDestinations(ROUTE_MODULE_INPUTS);
    expect(MENU_DESTINATIONS).toEqual(live);
  });

  it("todo path derivado tiene su label a mano en menu-destinations.labels.ts", () => {
    const live = deriveMenuDestinations(ROUTE_MODULE_INPUTS);
    const missing = live
      .map((destination) => destination.path)
      .filter((path) => !(path in MENU_DESTINATION_LABELS));

    expect(missing, `Faltan labels para: ${missing.join(", ")}`).toEqual([]);
  });

  it("no quedan labels huerfanos de rutas que ya no existen", () => {
    const live = new Set(
      deriveMenuDestinations(ROUTE_MODULE_INPUTS).map((d) => d.path),
    );
    const orphaned = Object.keys(MENU_DESTINATION_LABELS).filter(
      (path) => !live.has(path),
    );

    expect(orphaned, `Labels huerfanos (ruta ya no existe): ${orphaned.join(", ")}`).toEqual(
      [],
    );
  });
});

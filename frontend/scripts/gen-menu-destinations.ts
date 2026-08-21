import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import type { RouteObject } from "react-router-dom";
import {
  deriveMenuDestinations,
  type MenuDestination,
  type RouteModuleInput,
} from "./menu-destinations.derive.ts";

/**
 * Generador de `src/app/navigation/menu-destinations.generated.ts`.
 *
 * Razon industria (por que este mecanismo y no otro):
 * - El repo NO tiene `vite-node` ni `tsx` instalados (confirmado: no hay
 *   entrada en package.json ni en node_modules/.pnpm). La suposicion inicial
 *   del design ("vite-node, ya hay Vite/Vitest") no se sostiene tal cual.
 * - Lo que SI hay es `vite` (7.3.2) como dependencia real del proyecto. Este
 *   script usa la API programatica de Vite (`createServer` en modo
 *   middleware + `ssrLoadModule`) para cargar los `*.routes.config.tsx` con
 *   resolucion real de alias (`@routes/...`) y transform de JSX — es
 *   exactamente el mecanismo interno que usa `vite-node`, sin necesitar el
 *   paquete aparte.
 * - Se ejecuta con `node scripts/gen-menu-destinations.ts` sin flags: Node
 *   24 (instalado: v24.13.0) hace type-stripping nativo de TypeScript, asi
 *   que no hace falta ningun transpiler para correr ESTE archivo (los
 *   `*.routes.config.tsx` importados si necesitan el transform de Vite, por
 *   eso se cargan via `ssrLoadModule` y no via `import()` directo de Node).
 * - No se ejecutan componentes: `React.createElement` solo arma objetos
 *   `{ type, props }`, nunca invoca el cuerpo de la funcion. Cargar los
 *   modulos si dispara los `import` estaticos (no los `lazy()`, que quedan
 *   sin invocar hasta el render), pero no corre hooks ni efectos.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const MODULES_DIR = path.resolve(
  FRONTEND_ROOT,
  "src/app/router/modules",
);
const OUTPUT_FILE = path.resolve(
  FRONTEND_ROOT,
  "src/app/navigation/menu-destinations.generated.ts",
);

// Los 8 `*.routes.config.tsx` + su prefijo real, tal como se montan en
// `src/app/router/Routes.tsx` (ver AdminRoutes -> "/admin/*", etc.) y en
// `admin.routes.tsx` / `clinico.routes.tsx` / etc. (wrappers `useRoutes(...)`).
const ROUTE_MODULES: Array<{
  file: string;
  exportName: string;
  prefix: string;
}> = [
  { file: "admin.routes.config.tsx", exportName: "adminRoutes", prefix: "/admin" },
  { file: "clinico.routes.config.tsx", exportName: "clinicoRoutes", prefix: "/clinico" },
  { file: "recepcion.routes.config.tsx", exportName: "recepcionRoutes", prefix: "/recepcion" },
  { file: "farmacia.routes.config.tsx", exportName: "farmaciaRoutes", prefix: "/farmacia" },
  { file: "almacen.routes.config.tsx", exportName: "almacenRoutes", prefix: "/almacen" },
  { file: "servicios.routes.config.tsx", exportName: "serviciosRoutes", prefix: "/servicios" },
  { file: "core.routes.config.tsx", exportName: "coreRoutes", prefix: "/dashboard" },
  { file: "placeholders.routes.config.tsx", exportName: "urgenciasRoutes", prefix: "/urgencias" },
];

async function loadRouteModuleInputs(): Promise<RouteModuleInput[]> {
  const server = await createServer({
    configFile: path.resolve(FRONTEND_ROOT, "vite.config.ts"),
    root: FRONTEND_ROOT,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  try {
    const inputs: RouteModuleInput[] = [];
    for (const { file, exportName, prefix } of ROUTE_MODULES) {
      const absolutePath = path.resolve(MODULES_DIR, file);
      const mod = (await server.ssrLoadModule(absolutePath)) as Record<
        string,
        unknown
      >;
      const routes = mod[exportName];
      if (!Array.isArray(routes)) {
        throw new Error(
          `${file}: no se encontro el export "${exportName}" (o no es un array). ` +
            `Exports disponibles: ${Object.keys(mod).join(", ")}`,
        );
      }
      inputs.push({ routes: routes as RouteObject[], prefix });
    }
    return inputs;
  } finally {
    await server.close();
  }
}

function serialize(destinations: MenuDestination[]): string {
  const entries = destinations
    .map((d) => `  ${JSON.stringify(d)},`)
    .join("\n");

  return `/**
 * ARCHIVO AUTO-GENERADO — NO EDITAR A MANO.
 *
 * Generado por \`pnpm run gen:menu-destinations\`
 * (frontend/scripts/gen-menu-destinations.ts) a partir de los
 * \`RouteObject[]\` reales de los \`*.routes.config.tsx\` bajo
 * \`src/app/router/modules/\`, leyendo los props vivos de \`<ProtectedRoute>\`
 * (\`requiredPermission\`, \`fallbackRequirement.allOf/anyOf\`,
 * \`requiredAllPermissions\`, \`requiredAnyPermissions\`).
 *
 * Los labels humanos (nombres amigables para el selector de destino) NO se
 * derivan aca — viven a mano en \`menu-destinations.labels.ts\`.
 *
 * El test anti-drift (\`src/test/unit/navigation/menu-destinations.test.ts\`)
 * falla el CI si: (a) este archivo queda desincronizado de correr la
 * derivacion en vivo de nuevo, o (b) algun path derivado no tiene su label
 * correspondiente en el archivo a mano.
 *
 * Para regenerar: \`pnpm run gen:menu-destinations\`.
 */

export interface MenuDestination {
  path: string;
  permissions: string[];
  capability?: string;
}

export const MENU_DESTINATIONS: MenuDestination[] = [
${entries}
];
`;
}

async function main(): Promise<void> {
  const inputs = await loadRouteModuleInputs();
  const destinations = deriveMenuDestinations(inputs);
  const content = serialize(destinations);
  await fs.writeFile(OUTPUT_FILE, content, "utf-8");
  console.log(
    `menu-destinations.generated.ts: ${destinations.length} destinos derivados de ${ROUTE_MODULES.length} modulos de rutas.`,
  );
}

main().catch((error: unknown) => {
  console.error("gen-menu-destinations fallo:", error);
  process.exitCode = 1;
});

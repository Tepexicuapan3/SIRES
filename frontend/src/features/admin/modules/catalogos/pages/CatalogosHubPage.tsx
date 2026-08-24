import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { useNavigation } from "@features/navigation/hooks/useNavigation";
import { normalizeSearchText } from "@shared/utils/text/normalizeSearchText";
import type { NavItem } from "@app/navigation/nav-config";

/** Clave de sidebar del modulo raiz "Catalogos" (ver navigation_seed.py:
 * `administracion.catalogos`, promovido a seccion raiz). El titulo en BD no
 * lleva acento ("Catalogos") -- se compara normalizado para no depender de
 * esa grafia exacta. */
const CATALOGOS_SECTION_TITLE = "catalogos";

/** Aplana los items de la seccion (por si algun dia vuelve a tener
 * subcarpetas) y descarta los que no llevan a ninguna pantalla. */
function flattenLeafItems(items: NavItem[]): NavItem[] {
  const leaves: NavItem[] = [];
  const visit = (item: NavItem) => {
    if (item.items?.length) {
      item.items.forEach(visit);
      return;
    }
    if (item.url) leaves.push(item);
  };
  items.forEach(visit);
  return leaves;
}

/**
 * Indice de todos los catalogos: lista alfabetica + buscador tolerante a
 * acentos/mayusculas. La fuente es `useNavigation()` -- el mismo arbol ya
 * filtrado por permisos que alimenta el sidebar real, asi que cada usuario
 * solo ve los catalogos a los que tiene acceso (ni uno de mas, ni uno de
 * menos que lo que ya le muestra el menu lateral).
 */
export function CatalogosHubPage() {
  const { sections, isLoading } = useNavigation();
  const [search, setSearch] = useState("");

  const catalogos = useMemo(() => {
    const section = sections.find(
      (s) => normalizeSearchText(s.title) === CATALOGOS_SECTION_TITLE,
    );
    const leaves = section ? flattenLeafItems(section.items) : [];
    return [...leaves].sort((a, b) =>
      a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
    );
  }, [sections]);

  const normalizedSearch = normalizeSearchText(search);
  const filtered = normalizedSearch
    ? catalogos.filter((item) =>
        normalizeSearchText(item.title).includes(normalizedSearch),
      )
    : catalogos;

  return (
    <CatalogModuleLayout
      title="Catálogos"
      description="Datos de referencia del sistema, en orden alfabético. Busca por nombre para encontrar el que necesitas."
      icon={<BookOpen className="size-12" />}
    >
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Buscar catálogo por nombre"
        className="sm:max-w-sm"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={`catalogos-hub-skeleton-${index}`}
              className="h-14 animate-pulse rounded-xl border border-line-struct/60 bg-subtle/30"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct/70 bg-subtle/20 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-txt-body">
            {catalogos.length === 0
              ? "No tienes acceso a ningún catálogo."
              : `No hay catálogos que coincidan con "${search}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link
              key={item.url}
              to={item.url ?? "#"}
              className="flex items-center gap-3 rounded-xl border border-line-struct/60 bg-paper/50 px-4 py-3 text-sm font-medium text-txt-body transition-colors hover:border-line-struct hover:bg-surface-hover"
            >
              {item.icon ? (
                <item.icon className="size-4 shrink-0 text-txt-muted" />
              ) : null}
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </div>
      )}
    </CatalogModuleLayout>
  );
}

export default CatalogosHubPage;

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  NAV_CONFIG,
  type NavItem,
} from "@/components/layouts/sidebar/nav-config";
import { usePermissions } from "@features/auth/queries/usePermissions";

interface SearchItem {
  title: string;
  url: string;
  section: string;
  breadcrumb: string;
  badge?: string;
}

const flattenNavItems = (
  items: NavItem[],
  sectionTitle: string,
  parents: string[],
  isAdmin: boolean,
  hasAnyPermission: (permissions: string[]) => boolean,
  results: SearchItem[],
) => {
  items.forEach((item) => {
    const nextParents = [...parents, item.title];
    const isAllowed =
      !item.permissions ||
      item.permissions.length === 0 ||
      isAdmin ||
      hasAnyPermission(item.permissions);

    if (item.url && isAllowed) {
      results.push({
        title: item.title,
        url: item.url,
        section: sectionTitle,
        breadcrumb: nextParents.join(" / "),
        badge: item.badge,
      });
    }

    if (item.items) {
      flattenNavItems(
        item.items,
        sectionTitle,
        nextParents,
        isAdmin,
        hasAnyPermission,
        results,
      );
    }
  });
};

/**
 * Buscador de modulos con permisos.
 *
 * Razon industria:
 * - Permite navegar a modulos permitidos sin recorrer el sidebar.
 * - Respeta permisos para evitar sugerencias inconsistentes.
 */
export const ModuleSearch = () => {
  const navigate = useNavigate();
  const { isAdmin, hasAnyPermission } = usePermissions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(() => {
    const collected: SearchItem[] = [];
    NAV_CONFIG.forEach((section) => {
      flattenNavItems(
        section.items,
        section.title,
        [],
        isAdmin(),
        hasAnyPermission,
        collected,
      );
    });
    return collected;
  }, [hasAnyPermission, isAdmin]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return items
      .filter((item) => item.breadcrumb.toLowerCase().includes(term))
      .slice(0, 8);
  }, [items, query]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.url);
    setQuery("");
    setIsOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 120);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="ml-auto flex w-full max-w-sm items-center justify-end">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-muted" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              handleSelect(results[0]);
            }
          }}
          placeholder="Buscar modulo (Ctrl+K)"
          className="pl-9"
          aria-label="Buscar modulo"
        />
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-line-struct bg-paper shadow-lg">
            <ul className="max-h-72 overflow-auto py-2">
              {results.map((item) => (
                <li key={item.url}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-txt-body hover:bg-bg-subtle"
                    onMouseDown={() => handleSelect(item)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-txt-muted">
                        {item.section} • {item.breadcrumb}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-status-info px-2 py-0.5 text-[10px] text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

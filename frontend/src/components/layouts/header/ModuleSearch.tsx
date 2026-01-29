import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NAV_CONFIG,
  type NavItem,
} from "@/components/layouts/sidebar/nav-config";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  url: string;
  section: string;
  breadcrumb: string;
  badge?: string;
}

// Badge system - identical to NavMain.tsx
const BADGE_LABELS = {
  Dev: "Dess",
  New: "Nvo",
  Mantenimiento: "Mtto",
} as const;

type BadgeKey = keyof typeof BADGE_LABELS;

const BADGE_STYLES: Record<BadgeKey, string> = {
  Dev: "bg-status-alert/10 text-status-alert ring-1 ring-inset ring-status-alert/20",
  New: "bg-status-info/10 text-status-info ring-1 ring-inset ring-status-info/20",
  Mantenimiento:
    "bg-status-critical/10 text-status-critical ring-1 ring-inset ring-status-critical/20",
};

const resolveBadgeKey = (badge: string): BadgeKey =>
  badge in BADGE_LABELS ? (badge as BadgeKey) : "Dev";

const getBadgeClass = (badge: string) => BADGE_STYLES[resolveBadgeKey(badge)];
const getBadgeLabel = (badge: string) => BADGE_LABELS[resolveBadgeKey(badge)];

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
 * Buscador de modulos con permisos y navegacion por teclado.
 *
 * Razon industria:
 * - Permite navegar a modulos permitidos sin recorrer el sidebar.
 * - Respeta permisos para evitar sugerencias inconsistentes.
 * - Navegacion con flechas y Enter para accesibilidad.
 */
export const ModuleSearch = () => {
  const navigate = useNavigate();
  const { isAdmin, hasAnyPermission } = usePermissions();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Flatten nav items respetando permisos
  const items = (() => {
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
  })();

  // Filtrar resultados
  const results = (() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return items
      .filter((item) => item.breadcrumb.toLowerCase().includes(term))
      .slice(0, 8);
  })();

  // Reset activeIndex cuando cambian los resultados
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll al item activo
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeItem = listRef.current.children[activeIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = (item: SearchItem) => {
    // Quitar foco antes de navegar
    inputRef.current?.blur();
    dialogInputRef.current?.blur();

    navigate(item.url);
    setQuery("");
    setIsOpen(false);
    setIsDialogOpen(false);
    setActiveIndex(0);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Escape siempre cierra
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setIsDialogOpen(false);
      setQuery("");
      setActiveIndex(0);
      inputRef.current?.blur();
      dialogInputRef.current?.blur();
      return;
    }

    // Si no hay resultados, no hacer nada más
    if (results.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
        break;

      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        break;

      case "Enter":
        event.preventDefault();
        if (results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
    }
  };

  // Atajo global Ctrl+K
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isMobile) {
          setIsDialogOpen(true);
          setTimeout(() => dialogInputRef.current?.focus(), 0);
        } else {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile]);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Focus en dialog al abrir
  useEffect(() => {
    if (isDialogOpen) {
      setTimeout(() => dialogInputRef.current?.focus(), 0);
    }
  }, [isDialogOpen]);

  const renderResults = () => {
    if (!isOpen || results.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-line-struct bg-paper shadow-lg">
        <ul
          ref={listRef}
          role="listbox"
          className="max-h-72 overflow-auto py-1"
        >
          {results.map((item, index) => (
            <li
              key={item.url}
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-txt-body transition-colors",
                  index === activeIndex
                    ? "bg-line-struct/50"
                    : "hover:bg-line-struct/30",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="truncate text-xs text-txt-muted">
                    {item.section} • {item.breadcrumb}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                      getBadgeClass(item.badge),
                    )}
                  >
                    {getBadgeLabel(item.badge)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Desktop: input inline */}
      <div className="relative hidden w-full md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Buscar... (Ctrl+K)"
          className="h-8 w-full pl-8 pr-3 text-sm"
          aria-label="Buscar módulo"
          aria-expanded={isOpen && results.length > 0}
          aria-haspopup="listbox"
          aria-activedescendant={
            activeIndex >= 0 && results.length > 0
              ? `search-result-${activeIndex}`
              : undefined
          }
          role="combobox"
          autoComplete="off"
        />
        {renderResults()}
      </div>

      {/* Mobile: botón que abre dialog */}
      <div className="flex items-center justify-end md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Abrir buscador"
          onClick={() => setIsDialogOpen(true)}
        >
          <Search className="size-4" />
        </Button>
      </div>

      {/* Dialog para mobile */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="top-[10%] translate-y-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar módulo</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
            <Input
              ref={dialogInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar módulo..."
              className="h-11 w-full pl-9"
              aria-label="Buscar módulo"
              autoComplete="off"
            />
            {renderResults()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

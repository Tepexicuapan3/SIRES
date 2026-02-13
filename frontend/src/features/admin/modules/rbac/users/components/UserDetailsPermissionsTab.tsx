import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { comparePermissionCodesByHierarchy } from "@features/admin/modules/rbac/shared/utils/permission-hierarchy";
import { formatDateTime } from "@features/admin/modules/rbac/users/utils/users.format";
import { cn } from "@/lib/utils";
import type { Permission, UserOverride } from "@api/types";

interface UserDetailsPermissionsTabProps {
  overrides: UserOverride[];
  permissions: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  isSaving?: boolean;
  catalogErrorMessage?: string | null;
  onRetryCatalog?: () => void;
  onAddOverride: (permissionCode: string) => void;
  onToggleOverride: (permissionCode: string) => void;
  onOverrideDateChange: (permissionCode: string, value: string) => void;
  onRemoveOverride: (permissionCode: string) => void;
}

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const tokenizeSearchText = (value: string) =>
  normalizeSearchText(value)
    .split(/[\s:._-]+/)
    .filter(Boolean);

const SEARCH_SYNONYMS: Record<string, string[]> = {
  actualizar: ["update", "editar", "modificar"],
  update: ["actualizar", "editar", "modificar"],
  crear: ["create", "nuevo", "agregar"],
  create: ["crear", "nuevo", "agregar"],
  leer: ["read", "ver", "consulta"],
  ver: ["read", "leer", "consulta"],
  read: ["leer", "ver", "consulta"],
  eliminar: ["delete", "remove", "borrar"],
  delete: ["eliminar", "quitar", "borrar"],
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateValue = (value: string | null | undefined) => {
  if (!value) return null;

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(date);

const isSubsequenceMatch = (needle: string, haystack: string) => {
  if (!needle || !haystack) return false;

  let needleIndex = 0;
  for (
    let haystackIndex = 0;
    haystackIndex < haystack.length;
    haystackIndex += 1
  ) {
    if (needle[needleIndex] === haystack[haystackIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) return true;
    }
  }

  return false;
};

const getPermissionSearchScore = (permission: Permission, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;

  const normalizedCode = normalizeSearchText(permission.code);
  const normalizedDescription = normalizeSearchText(permission.description);
  const queryTokens = tokenizeSearchText(query);
  const codeTokens = tokenizeSearchText(permission.code);
  const descriptionTokens = tokenizeSearchText(permission.description);

  let score = 0;

  if (normalizedCode === normalizedQuery) score += 700;
  if (normalizedDescription === normalizedQuery) score += 650;

  if (normalizedCode.startsWith(normalizedQuery)) score += 420;
  if (normalizedDescription.startsWith(normalizedQuery)) score += 390;

  if (normalizedCode.includes(normalizedQuery)) score += 280;
  if (normalizedDescription.includes(normalizedQuery)) score += 250;

  queryTokens.forEach((token) => {
    const semanticAliases = [token, ...(SEARCH_SYNONYMS[token] ?? [])];
    const hasSemanticMatch = semanticAliases.some(
      (alias) =>
        codeTokens.some((codeToken) => codeToken.startsWith(alias)) ||
        descriptionTokens.some((descriptionToken) =>
          descriptionToken.startsWith(alias),
        ),
    );

    if (hasSemanticMatch) {
      score += 145;
      return;
    }

    const codeTokenMatch = codeTokens.find((codeToken) =>
      codeToken.startsWith(token),
    );
    const descriptionTokenMatch = descriptionTokens.find((descriptionToken) =>
      descriptionToken.startsWith(token),
    );

    if (codeTokenMatch) {
      score += 120;
      return;
    }

    if (descriptionTokenMatch) {
      score += 110;
      return;
    }

    if (normalizedCode.includes(token)) {
      score += 70;
      return;
    }

    if (normalizedDescription.includes(token)) {
      score += 65;
      return;
    }

    score -= 45;
  });

  if (isSubsequenceMatch(normalizedQuery, normalizedCode)) score += 80;
  if (isSubsequenceMatch(normalizedQuery, normalizedDescription)) score += 70;

  return score;
};

export function UserDetailsPermissionsTab({
  overrides,
  permissions,
  isLoadingPermissions,
  isEditable = true,
  isSaving = false,
  catalogErrorMessage = null,
  onRetryCatalog,
  onAddOverride,
  onToggleOverride,
  onOverrideDateChange,
  onRemoveOverride,
}: UserDetailsPermissionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [openDatePickerCode, setOpenDatePickerCode] = useState<string | null>(
    null,
  );
  const resultsRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isBusy = isSaving;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getOverrideDate = (expiresAt: string | null) => {
    return parseDateValue(expiresAt);
  };

  const isPastDate = (date: Date) => date < today;
  const isCalendarDateDisabled = (date: Date) => {
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return normalizedDate < today;
  };

  const handleOverrideDateSelect = (permissionCode: string, date?: Date) => {
    if (!date) {
      setDateErrors((previous) => ({ ...previous, [permissionCode]: "" }));
      onOverrideDateChange(permissionCode, "");
      setOpenDatePickerCode(null);
      return;
    }

    if (isPastDate(date)) {
      setDateErrors((previous) => ({
        ...previous,
        [permissionCode]: "La fecha debe ser posterior a hoy.",
      }));
      return;
    }

    setDateErrors((previous) => ({ ...previous, [permissionCode]: "" }));
    onOverrideDateChange(permissionCode, toLocalDateInputValue(date));
    setOpenDatePickerCode(null);
  };

  const availablePermissions = permissions.filter(
    (permission) =>
      !overrides.some(
        (override) => override.permissionCode === permission.code,
      ),
  );

  const sortedAvailablePermissions = [...availablePermissions].sort(
    (first, second) =>
      comparePermissionCodesByHierarchy(first.code, second.code),
  );

  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const hasMinSearchLength = normalizedSearchQuery.length >= 2;

  const rankedPermissions = hasMinSearchLength
    ? sortedAvailablePermissions
        .map((permission) => ({
          permission,
          score: getPermissionSearchScore(permission, searchQuery),
        }))
        .filter((item) => item.score > 0)
        .sort(
          (first, second) =>
            second.score - first.score ||
            comparePermissionCodesByHierarchy(
              first.permission.code,
              second.permission.code,
            ),
        )
    : [];

  const visiblePermissions = rankedPermissions.slice(0, 12);
  const highlightedIndex =
    hasMinSearchLength && visiblePermissions.length > 0
      ? Math.min(Math.max(activeResultIndex, 0), visiblePermissions.length - 1)
      : -1;
  const activeOptionId =
    highlightedIndex >= 0
      ? `permission-search-option-${visiblePermissions[highlightedIndex]?.permission.id ?? ""}`
      : undefined;

  useEffect(() => {
    if (highlightedIndex < 0) return;
    resultsRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  const sortedOverrides = [...overrides].sort((first, second) =>
    comparePermissionCodesByHierarchy(
      first.permissionCode,
      second.permissionCode,
    ),
  );

  const handleAddSelectedOverride = (permissionCode: string) => {
    if (!permissionCode || !isEditable || isBusy) return;
    onAddOverride(permissionCode);
    setSearchQuery("");
  };

  const handleSearchEnter = () => {
    if (!hasMinSearchLength) return;
    const selectedCode =
      visiblePermissions[highlightedIndex]?.permission.code ??
      visiblePermissions[0]?.permission.code;
    if (!selectedCode) return;
    handleAddSelectedOverride(selectedCode);
  };

  return (
    <div className="space-y-6">
      {catalogErrorMessage ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-xs text-status-critical">
          <p>{catalogErrorMessage}</p>
          {onRetryCatalog ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onRetryCatalog}
            >
              Reintentar catalogo
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-txt-body">
            Overrides de permisos
          </h4>
          <p className="text-xs text-txt-muted">
            Permite o deniega permisos especificos que sobrescriben la
            configuracion heredada del rol.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-txt-muted" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setActiveResultIndex(0);
              }}
              onKeyDown={(event) => {
                if (!hasMinSearchLength || visiblePermissions.length === 0) {
                  if (event.key === "Escape") {
                    setSearchQuery("");
                    setActiveResultIndex(-1);
                  }
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveResultIndex((previous) =>
                    previous >= visiblePermissions.length - 1
                      ? 0
                      : previous + 1,
                  );
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveResultIndex((previous) =>
                    previous <= 0
                      ? visiblePermissions.length - 1
                      : previous - 1,
                  );
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchEnter();
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setSearchQuery("");
                  setActiveResultIndex(-1);
                }
              }}
              aria-label="Buscar permiso para override"
              aria-expanded={hasMinSearchLength}
              aria-controls={
                hasMinSearchLength ? "permission-search-results" : undefined
              }
              aria-activedescendant={
                hasMinSearchLength ? activeOptionId : undefined
              }
              placeholder="Buscar permiso por nombre o codigo..."
              disabled={
                !isEditable ||
                isBusy ||
                isLoadingPermissions ||
                Boolean(catalogErrorMessage)
              }
              className="h-10 pl-9 focus:border-line-struct/70 focus:ring-2 focus:ring-line-struct/20 focus-visible:ring-2 focus-visible:ring-line-struct/20"
            />
            {hasMinSearchLength ? (
              <div
                id="permission-search-results"
                role="listbox"
                aria-label="Resultados de permisos"
                className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-40 max-h-56 overflow-y-auto rounded-xl border border-line-struct/60 bg-paper p-1 shadow-modal"
              >
                {visiblePermissions.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-txt-muted">
                    {`No se encontraron permisos para "${searchQuery}".`}
                  </p>
                ) : (
                  visiblePermissions.map(({ permission }, index) => (
                    <button
                      key={permission.id}
                      id={`permission-search-option-${permission.id}`}
                      type="button"
                      ref={(element) => {
                        resultsRefs.current[index] = element;
                      }}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-subtle/70 focus-visible:ring-2 focus-visible:ring-line-struct/60 focus-visible:outline-none",
                        highlightedIndex === index &&
                          "bg-subtle/70 ring-1 ring-line-struct/60",
                      )}
                      onClick={() => handleAddSelectedOverride(permission.code)}
                      onMouseEnter={() => setActiveResultIndex(index)}
                      aria-label={`Agregar override ${permission.code}`}
                      disabled={!isEditable || isBusy}
                    >
                      <div className="truncate text-sm text-txt-body">
                        {permission.description}
                      </div>
                      <div className="truncate text-[11px] text-txt-muted">
                        {permission.code}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {hasMinSearchLength && visiblePermissions.length > 0 ? (
            <p className="text-[11px] text-txt-muted">
              Usa flechas para navegar y Enter para agregar.
            </p>
          ) : null}
        </div>

        {isLoadingPermissions ? (
          <p className="mt-2 text-xs text-txt-muted">Cargando permisos...</p>
        ) : sortedAvailablePermissions.length === 0 ? (
          <p className="mt-2 text-xs text-txt-muted">
            No hay permisos disponibles para agregar override.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-2">
          {sortedOverrides.length === 0 ? (
            <div className="rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-4 text-sm text-txt-muted">
              No hay overrides configurados.
            </div>
          ) : (
            sortedOverrides.map((override) => {
              const isAllowed = override.effect === "ALLOW";
              const StatusIcon = isAllowed ? ShieldCheck : ShieldAlert;
              const permissionTitle =
                override.permissionDescription || override.permissionCode;
              const expiresDate = getOverrideDate(override.expiresAt);
              const isDatePickerOpen =
                openDatePickerCode === override.permissionCode;
              const dateError = dateErrors[override.permissionCode];
              const isExpired =
                override.isExpired ||
                (expiresDate ? isPastDate(expiresDate) : false);

              return (
                <div
                  key={override.permissionCode}
                  className="overflow-hidden rounded-xl border border-line-struct/60 bg-paper/80"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className={
                          isAllowed
                            ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-stable/10 text-status-stable"
                            : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-critical/10 text-status-critical"
                        }
                      >
                        <StatusIcon className="size-4" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-medium text-txt-body">
                          {permissionTitle}
                        </div>
                        <div className="truncate text-xs text-txt-muted">
                          {override.permissionCode}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className={
                          isAllowed
                            ? "text-sm font-semibold text-status-stable"
                            : "text-sm font-semibold text-status-critical"
                        }
                      >
                        {isAllowed ? "Allow" : "Deny"}
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAllowed}
                        aria-label={`Cambiar efecto de ${override.permissionCode}`}
                        onClick={() =>
                          onToggleOverride(override.permissionCode)
                        }
                        disabled={isBusy || !isEditable}
                        className={
                          isAllowed
                            ? "relative inline-flex h-5 w-9 items-center rounded-full border border-line-struct bg-status-stable transition-colors"
                            : "relative inline-flex h-5 w-9 items-center rounded-full border border-line-struct bg-status-critical/25 transition-colors"
                        }
                      >
                        <span
                          className={
                            isAllowed
                              ? "block size-4 translate-x-4 rounded-full bg-paper shadow-sm transition-transform"
                              : "block size-4 translate-x-0.5 rounded-full bg-paper shadow-sm transition-transform"
                          }
                        />
                      </button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar override ${override.permissionCode}`}
                        onClick={() =>
                          onRemoveOverride(override.permissionCode)
                        }
                        disabled={isBusy || !isEditable}
                        className="size-8 shrink-0 rounded-lg"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-struct/50 px-3 py-2 text-xs text-txt-muted">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <UserRound className="size-3.5" />
                      <span className="truncate">
                        {override.assignedBy?.name ?? "-"}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <CalendarDays className="size-3.5" />
                      {formatDateTime(override.assignedAt)}
                    </span>

                    <div className="ml-auto flex items-center gap-1">
                      {expiresDate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 rounded-md text-txt-muted hover:text-txt-body"
                          aria-label={`Quitar fecha de expiracion ${override.permissionCode}`}
                          onClick={() =>
                            handleOverrideDateSelect(override.permissionCode)
                          }
                          disabled={!isEditable || isBusy}
                        >
                          <X className="size-3.5" />
                        </Button>
                      ) : null}

                      <Popover
                        open={isDatePickerOpen}
                        onOpenChange={(open) =>
                          setOpenDatePickerCode(
                            open ? override.permissionCode : null,
                          )
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 min-w-[152px] justify-between rounded-lg border-line-struct/70 bg-paper px-2.5 text-xs font-normal shadow-none",
                              !expiresDate && "text-txt-muted",
                              isExpired && "text-status-critical",
                            )}
                            aria-label={`Fecha de expiracion ${override.permissionCode}`}
                            disabled={!isEditable || isBusy}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <CalendarDays className="size-3.5 shrink-0 text-txt-muted" />
                              <span className="truncate">
                                {expiresDate
                                  ? formatLocalDisplayDate(expiresDate)
                                  : "Sin vencimiento"}
                              </span>
                            </span>
                            <ChevronDown className="size-3.5 text-txt-muted" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            defaultMonth={expiresDate ?? today}
                            fromYear={today.getFullYear()}
                            toYear={today.getFullYear() + 10}
                            selected={expiresDate ?? undefined}
                            onSelect={(date) =>
                              handleOverrideDateSelect(
                                override.permissionCode,
                                date,
                              )
                            }
                            disabled={isCalendarDateDisabled}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {dateError ? (
                    <div className="border-t border-line-struct/50 px-3 py-2 text-xs text-status-critical">
                      {dateError}
                    </div>
                  ) : isExpired ? (
                    <div className="border-t border-line-struct/50 px-3 py-2 text-xs text-status-critical">
                      Fecha de vencimiento expirada.
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-txt-muted">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-status-stable" />
          Allow: concede el permiso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="size-3.5 text-status-critical" />
          Deny: revoca el permiso
        </span>
      </div>
    </div>
  );
}

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FolderInput,
  Pencil,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/ui/tooltip";
import { cn } from "@shared/utils/styling/cn";
import { resolveNavIcon } from "@/app/navigation/nav-icons";
import type { ModuleCatalogNodeDTO } from "@api/types";

interface ModuleTreeRowProps {
  node: ModuleCatalogNodeDTO;
  depth: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isBusy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToFolder: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
}

const SYSTEM_TOOLTIP =
  "Módulo de sistema: no puede ocultarse ni moverse. Protege una sección crítica de la navegación.";

/**
 * Fila de un nodo del arbol editable (`ModuleTreeEditor`). Muestra icono,
 * titulo, badges de estado ("Oculto"/"Sistema"/"Siempre visible") y las
 * acciones de reordenamiento con botones -- NUNCA drag-and-drop (decision
 * de diseño explicita, ver design doc).
 *
 * `es_sistema=True` deshabilita "Mover"/"Ocultar" (con tooltip explicando
 * por que) pero NO deshabilita "Editar": el titulo/icono/destino de un
 * nodo de sistema se puede seguir editando, solo su posicion y visibilidad
 * estan protegidas (mismo alcance que `assert_not_system` en el backend,
 * invocado solo desde `HideModuleUseCase`/`MoveModuleUseCase`).
 */
export function ModuleTreeRow({
  node,
  depth,
  canMoveUp,
  canMoveDown,
  canUpdate,
  canDelete,
  isBusy,
  onMoveUp,
  onMoveDown,
  onMoveToFolder,
  onEdit,
  onToggleVisibility,
}: ModuleTreeRowProps) {
  const isUnmanaged = node.permissions.length === 0;
  const protectedNode = node.isSystem;
  // Ver comentario en RoleDetailsModulesTab.tsx: se envuelve en un objeto
  // para no romper react-hooks/static-components con `resolveNavIcon`.
  const icon = { Component: resolveNavIcon(node.icon) };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
        node.isActive
          ? "border-line-struct/45 bg-paper/50"
          : "border-dashed border-line-struct/45 bg-subtle/30 opacity-70",
      )}
      style={{ marginLeft: depth * 20 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <icon.Component className="size-4 shrink-0 text-txt-muted" />
        <span className="truncate text-sm font-medium text-txt-body">
          {node.title}
        </span>
        {node.isSection ? (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            Carpeta
          </Badge>
        ) : null}
        {!node.isActive ? (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            Oculto
          </Badge>
        ) : null}
        {protectedNode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Sistema
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{SYSTEM_TOOLTIP}</TooltipContent>
          </Tooltip>
        ) : null}
        {isUnmanaged && !node.isSection ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="shrink-0 text-[10px] text-txt-muted">
                Sin permiso
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Este destino no declara permisos: lo verá cualquiera que vea la
              carpeta que lo contiene. No se administra desde acá.
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {canUpdate ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!canMoveUp || isBusy}
                onClick={onMoveUp}
                aria-label={`Subir ${node.title}`}
              >
                <ChevronUp className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subir</TooltipContent>
          </Tooltip>
        ) : null}
        {canUpdate ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!canMoveDown || isBusy}
                onClick={onMoveDown}
                aria-label={`Bajar ${node.title}`}
              >
                <ChevronDown className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bajar</TooltipContent>
          </Tooltip>
        ) : null}
        {canUpdate ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={protectedNode || isBusy}
                  onClick={onMoveToFolder}
                  aria-label={`Mover ${node.title} a otra carpeta`}
                >
                  <FolderInput className="size-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {protectedNode ? SYSTEM_TOOLTIP : "Mover a otra carpeta"}
            </TooltipContent>
          </Tooltip>
        ) : null}
        {canUpdate ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={isBusy}
                onClick={onEdit}
                aria-label={`Editar ${node.title}`}
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        ) : null}
        {canDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={(protectedNode && node.isActive) || isBusy}
                  onClick={onToggleVisibility}
                  aria-label={
                    node.isActive
                      ? `Ocultar ${node.title} del menú`
                      : `Restaurar ${node.title} al menú`
                  }
                >
                  {node.isActive ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {protectedNode && node.isActive
                ? SYSTEM_TOOLTIP
                : node.isActive
                  ? "Ocultar del menú"
                  : "Restaurar al menú"}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

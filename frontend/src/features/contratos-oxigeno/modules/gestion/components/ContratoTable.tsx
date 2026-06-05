import { ChevronDown, ChevronUp, ChevronsUpDown, Edit2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge }  from "@shared/ui/badge";
import { CONTRATO_STATUS, TP_DER_LABELS, type ContratoOxigeno, type ContratoStatus } from "@api/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function DiasCell({ dias }: { dias: number | null }) {
  if (dias === null) return <span className="text-txt-muted">—</span>;
  if (dias < 0)
    return (
      <span className="font-medium text-red-600">
        Vencido hace {Math.abs(dias)} días
      </span>
    );
  if (dias <= 30)
    return <span className="font-semibold text-amber-600">{dias} días</span>;
  return <span className="text-txt-body">{dias} días</span>;
}

function StatusBadge({ status }: { status: ContratoStatus }) {
  const variant =
    status === CONTRATO_STATUS.VIGENTE    ? "stable"   :
    status === CONTRATO_STATUS.POR_VENCER ? "alert"    :
                                            "critical";
  const label =
    status === CONTRATO_STATUS.VIGENTE    ? "Vigente"    :
    status === CONTRATO_STATUS.POR_VENCER ? "Por Vencer" :
                                            "Vencido";
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Cabecera ordenable ────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

interface SortableHeaderProps {
  label:    string;
  field:    string;
  current:  string;
  dir:      SortDir;
  onSort:   (field: string) => void;
}

function SortableHeader({ label, field, current, dir, onSort }: SortableHeaderProps) {
  const active = current === field;
  return (
    <button
      type="button"
      className="flex items-center gap-1 whitespace-nowrap font-medium hover:text-primary"
      onClick={() => onSort(field)}
    >
      {label}
      {active && dir === "asc"  ? <ChevronUp   className="size-3" /> :
       active && dir === "desc" ? <ChevronDown  className="size-3" /> :
                                  <ChevronsUpDown className="size-3 opacity-40" />}
    </button>
  );
}

// ── Paginación ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  pageSize:   number;
  onPage:     (page: number) => void;
}

function Pagination({ page, totalPages, total, pageSize, onPage }: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-struct px-4 py-3 text-sm">
      <p className="text-txt-muted">
        {total === 0 ? "Sin resultados" : `${from}–${to} de ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Anterior
        </Button>
        <span className="px-3 text-txt-muted">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

// ── Tabla principal ───────────────────────────────────────────────────────────

interface Props {
  contratos:   ContratoOxigeno[];
  isLoading:   boolean;
  page:        number;
  totalPages:  number;
  total:       number;
  pageSize:    number;
  sortField:   string;
  sortDir:     SortDir;
  onSort:      (field: string) => void;
  onPage:      (page: number) => void;
  onEdit:      (contrato: ContratoOxigeno) => void;
  onDelete:    (contrato: ContratoOxigeno) => void;
}

export function ContratoTable({
  contratos, isLoading,
  page, totalPages, total, pageSize,
  sortField, sortDir,
  onSort, onPage, onEdit, onDelete,
}: Props) {
  const sortProps = (field: string) => ({
    field, current: sortField, dir: sortDir, onSort,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-line-struct bg-paper">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-line-struct bg-subtle/30 text-xs text-txt-muted">
              <th className="px-4 py-3 text-left">
                <SortableHeader label="N° Contrato" {...sortProps("num_contrato")} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="Nombre" {...sortProps("nombre")} />
              </th>
              <th className="px-4 py-3 text-left">Expediente</th>
              <th className="px-4 py-3 text-left">TP Der</th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="Sucursal" {...sortProps("sucursal")} />
              </th>
              <th className="px-4 py-3 text-left">Clínica</th>
              <th className="px-4 py-3 text-left">Servicio</th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="Fecha Renovar" {...sortProps("fecha_renovar")} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="Días Faltan" {...sortProps("dias_faltan")} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader label="Status" {...sortProps("status")} />
              </th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-txt-muted">
                    <Loader2 className="size-4 animate-spin" /> Cargando contratos...
                  </div>
                </td>
              </tr>
            ) : contratos.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-txt-muted">
                  No hay contratos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              contratos.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-line-struct/50 last:border-0 hover:bg-subtle/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-primary">
                    {c.numContrato}
                  </td>
                  <td className="px-4 py-3 font-medium text-txt-body max-w-[180px] truncate">
                    {c.nombre}
                  </td>
                  <td className="px-4 py-3 font-mono text-txt-muted">{c.expediente}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      <span className="font-semibold">{c.tpDer}</span>
                      {" — "}
                      {TP_DER_LABELS[c.tpDer] ?? c.tpDer}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-txt-muted">
                    {c.sucursal}
                  </td>
                  <td className="px-4 py-3 text-xs text-txt-body max-w-[140px] truncate">
                    {c.clinica}
                  </td>
                  <td className="px-4 py-3 text-xs text-txt-body">{c.servicio}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatDate(c.fechaRenovar)}</td>
                  <td className="px-4 py-3">
                    <DiasCell dias={c.diasFaltan} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Editar"
                        onClick={() => onEdit(c)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar"
                        onClick={() => onDelete(c)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages || 1}
        total={total}
        pageSize={pageSize}
        onPage={onPage}
      />
    </div>
  );
}

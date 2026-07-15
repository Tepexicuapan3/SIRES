import { Badge } from "@shared/ui/badge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { formatDateTime } from "@/domains/auth-access/adapters/rbac/shared/rbac-format";
import { formatDuration } from "@/domains/auth-access/adapters/sessions/sessions.format";
import { SESSION_ESTADO, type SessionListItem } from "@api/types";

const CERRADA_POR_LABEL: Record<string, string> = {
  LOGOUT: "Cierre manual",
  EXPIRACION: "Inactividad",
};

export const sessionsTableColumns: DataTableColumn<SessionListItem>[] = [
  {
    key: "usuario",
    header: "Usuario",
    className: "w-[220px]",
    render: (row) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-txt-body">
          {row.nombreCompleto}
        </span>
        <span className="truncate text-xs text-txt-muted">{row.usuario}</span>
      </div>
    ),
  },
  {
    key: "ipOrigen",
    header: "IP",
    accessorKey: "ipOrigen",
    className: "w-[140px]",
  },
  {
    key: "fechaInicio",
    header: "Inicio",
    className: "w-[170px]",
    render: (row) => formatDateTime(row.fechaInicio),
  },
  {
    key: "fechaFin",
    header: "Fin",
    className: "w-[170px]",
    render: (row) =>
      row.fechaFin ? formatDateTime(row.fechaFin) : "En curso",
  },
  {
    key: "duracion",
    header: "Duración",
    className: "w-[100px]",
    render: (row) => formatDuration(row.duracionSegundos),
  },
  {
    key: "estado",
    header: "Estado",
    className: "w-[130px]",
    render: (row) =>
      row.estado === SESSION_ESTADO.ACTIVA ? (
        <Badge variant="stable">Activa</Badge>
      ) : (
        <Badge variant="secondary">
          {CERRADA_POR_LABEL[row.cerradaPor ?? ""] ?? "Cerrada"}
        </Badge>
      ),
  },
  {
    key: "userAgent",
    header: "Dispositivo",
    render: (row) => row.userAgent ?? "—",
  },
];

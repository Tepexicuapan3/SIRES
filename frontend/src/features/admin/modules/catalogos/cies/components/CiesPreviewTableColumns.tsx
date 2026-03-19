import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CiesUploadRow } from "@api/resources/catalogos/cies.api";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";

const rowHasError = (row: CiesUploadRow) => row.ERROR.trim().length > 0;

export const CIES_PREVIEW_COLUMNS: DataTableColumn<CiesUploadRow>[] = [
  {
    key: "CLAVE",
    header: "Clave",
    accessorKey: "CLAVE",
    className: "w-[140px]",
    cellContentClassName: "font-mono text-xs text-txt-body",
  },
  {
    key: "DESCRIPCION",
    header: "Descripcion",
    accessorKey: "DESCRIPCION",
    className: "w-[420px]",
    cellContentClassName: "max-w-[420px]",
    truncate: false,
  },
  {
    key: "VERSION",
    header: "Version",
    accessorKey: "VERSION",
    align: "center",
    className: "w-[140px]",
    cellContentClassName: "text-xs text-txt-muted",
  },
  {
    key: "ERROR",
    header: "Resultado",
    align: "center",
    className: "w-[260px]",
    cellContentClassName: "mx-auto flex justify-center",
    render: (row) => {
      const hasError = rowHasError(row);

      if (hasError) {
        return (
          <Badge variant="critical" className="max-w-full">
            <AlertTriangle className="size-3" />
            <span className="truncate">{row.ERROR.trim()}</span>
          </Badge>
        );
      }

      return (
        <Badge variant="stable">
          <CheckCircle2 className="size-3" />
          Sin errores
        </Badge>
      );
    },
  },
];

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import type { CatalogImportRow } from "@api/resources/catalogos/catalog-import.api";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import type { CatalogImportConfig } from "@features/admin/modules/catalogos/shared/import/catalog-import.config";

const rowHasError = (row: CatalogImportRow) => row.ERROR.trim().length > 0;

export function buildCatalogImportPreviewColumns(
  config: CatalogImportConfig,
): DataTableColumn<CatalogImportRow>[] {
  const dataColumns: DataTableColumn<CatalogImportRow>[] = config.columns.map(
    (column) => ({
      key: column.key,
      header: column.header,
      align: column.align,
      className: column.className,
      render: (row) => String(row[column.key] ?? ""),
    }),
  );

  return [
    ...dataColumns,
    {
      key: "ERROR",
      header: "Resultado",
      align: "center",
      className: "w-[260px]",
      cellContentClassName: "mx-auto flex justify-center",
      render: (row) => {
        if (rowHasError(row)) {
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
}

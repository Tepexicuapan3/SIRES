import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import type { UserImportRow } from "@api/types";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";

/**
 * Columnas de la tabla de vista previa de importacion masiva de usuarios.
 * Refleja el orden de la plantilla: Usuario | Nombre(s) | Apellido Paterno |
 * Apellido Materno | Correo | No. Expediente SERMED | Rol | Estado.
 */
export function buildUserImportPreviewColumns(): DataTableColumn<UserImportRow>[] {
  return [
    {
      key: "row",
      header: "Fila",
      align: "center",
      className: "w-[70px]",
      render: (row) => row.row,
    },
    {
      key: "username",
      header: "Usuario",
      render: (row) => row.data.username || "—",
    },
    {
      key: "fullname",
      header: "Nombre completo",
      render: (row) =>
        [row.data.firstName, row.data.paternalName, row.data.maternalName]
          .filter(Boolean)
          .join(" ") || "—",
    },
    {
      key: "email",
      header: "Correo",
      render: (row) => row.data.email || "—",
    },
    {
      key: "noExp",
      header: "No. Exp. SERMED",
      render: (row) => row.data.noExp || "—",
    },
    {
      key: "roleName",
      header: "Rol",
      render: (row) => row.data.roleName || "—",
    },
    {
      key: "estado",
      header: "Estado",
      align: "center",
      className: "w-[110px]",
      render: (row) => row.data.estado || "—",
    },
    {
      key: "errors",
      header: "Resultado",
      align: "center",
      className: "w-[280px]",
      cellContentClassName: "mx-auto flex justify-center",
      truncate: false,
      render: (row) => {
        if (row.errors.length > 0) {
          return (
            <div className="flex flex-col items-center gap-1">
              {row.errors.map((message, index) => (
                <Badge
                  key={index}
                  variant="critical"
                  className="max-w-full whitespace-normal text-left"
                >
                  <AlertTriangle className="size-3 shrink-0" />
                  <span>{message}</span>
                </Badge>
              ))}
            </div>
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

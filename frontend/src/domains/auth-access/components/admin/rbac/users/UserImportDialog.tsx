import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CircleAlert,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/utils/styling/cn";
import { DataTable } from "@features/admin/shared/components/DataTable";
import type { UserImportResult } from "@api/types";
import { useUserImportPreview } from "@/domains/auth-access/hooks/rbac/users/useUserImportPreview";
import { useUserImportConfirm } from "@/domains/auth-access/hooks/rbac/users/useUserImportConfirm";
import { useUserImportTemplateDownload } from "@/domains/auth-access/hooks/rbac/users/useUserImportTemplateDownload";
import { buildUserImportPreviewColumns } from "@/domains/auth-access/components/admin/rbac/users/buildUserImportPreviewColumns";
import { getUserErrorMessage } from "@/domains/auth-access/adapters/rbac/users/users.feedback";

interface UserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_FILE = ".xlsx";
const DEFAULT_PAGE_SIZE = 10;

export function UserImportDialog({ open, onOpenChange }: UserImportDialogProps) {
  const fileInputId = useId();
  const preview = useUserImportPreview();
  const confirmImport = useUserImportConfirm();
  const { download, isDownloading } = useUserImportTemplateDownload();

  const [file, setFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<UserImportResult | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const columns = useMemo(() => buildUserImportPreviewColumns(), []);

  const rows = previewResult?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageRows = rows.slice(pageStart, pageStart + pageSize);

  const resetFlow = () => {
    setFile(null);
    setPreviewResult(null);
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFlow();
    }
    onOpenChange(nextOpen);
  };

  const handlePreview = async () => {
    if (!file || preview.isPending) return;

    try {
      const result = await preview.mutateAsync({ file });
      setPreviewResult(result);
      setPage(1);

      const validRows = result.totalRecords - result.totalErrores;
      toast.success("Vista previa generada", {
        description:
          result.totalErrores > 0
            ? `${validRows} fila${validRows !== 1 ? "s" : ""} valida${validRows !== 1 ? "s" : ""} y ${result.totalErrores} con error.`
            : `${result.totalRecords} fila${result.totalRecords !== 1 ? "s" : ""} lista${result.totalRecords !== 1 ? "s" : ""} para importar.`,
      });
    } catch (error) {
      toast.error("No se pudo procesar el archivo", {
        description: getUserErrorMessage(
          error,
          "Verifica el archivo e intenta nuevamente.",
        ),
      });
    }
  };

  const canConfirm =
    previewResult !== null &&
    previewResult.totalRecords > 0 &&
    previewResult.totalErrores === 0;

  const handleConfirm = async () => {
    if (!file || !canConfirm || confirmImport.isPending) return;

    try {
      const result = await confirmImport.mutateAsync({ file });
      setPreviewResult(result);
      setPage(1);

      if (result.totalErrores > 0) {
        toast.error("La importacion tiene filas con error", {
          description:
            "No se creo ningun usuario. Corrige el archivo y volve a subirlo.",
        });
        return;
      }

      const failedCount = result.emailFailures?.length ?? 0;
      if (failedCount > 0) {
        const usernames = result.emailFailures!.map((f) => f.username).join(", ");
        toast.warning("Usuarios importados con avisos", {
          description: `${result.inserted} usuario${result.inserted !== 1 ? "s" : ""} se ${result.inserted !== 1 ? "crearon" : "creo"}, pero no se pudo enviar el correo de credenciales a: ${usernames}. Reenvialas manualmente.`,
        });
      } else {
        toast.success("Usuarios importados", {
          description: `${result.inserted} usuario${result.inserted !== 1 ? "s" : ""} se ${result.inserted !== 1 ? "crearon" : "creo"} correctamente.`,
        });
      }
      handleDialogOpenChange(false);
    } catch (error) {
      toast.error("No se pudo confirmar la importacion", {
        description: getUserErrorMessage(
          error,
          "No se creo ningun usuario. Intenta nuevamente.",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] sm:max-w-[92vw] lg:w-215 lg:max-w-215 xl:w-235 xl:max-w-235">
        <div className="flex min-w-0 max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle>Importar usuarios desde Excel</DialogTitle>
            <DialogDescription>
              Descarga la plantilla, completala y sube el archivo para
              previsualizar los usuarios antes de confirmar la creacion.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8 pt-4">
            <section className="space-y-4 rounded-2xl border border-line-struct bg-paper p-4 sm:p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => void download()}
                disabled={isDownloading}
              >
                <Download className="size-4" />
                {isDownloading ? "Descargando..." : "Descargar plantilla"}
              </Button>

              <div className="space-y-1.5 text-xs text-txt-muted">
                <p>
                  Columnas, en este orden: <strong>Usuario</strong>,{" "}
                  <strong>Nombre(s)</strong>, <strong>Apellido Paterno</strong>
                  , Apellido Materno, Correo,{" "}
                  <strong>No. Expediente SERMED</strong>, <strong>Rol</strong>,
                  Tipo de Personal, Estado.
                </p>
                <p>
                  Obligatorios: Usuario, Nombre(s) y Rol. El resto es
                  opcional.
                </p>
                <p>
                  Rol se busca por nombre exacto contra los roles existentes
                  en el sistema.
                </p>
                <p>
                  Tipo de Personal es opcional y, si se completa, se busca
                  por nombre exacto contra los tipos de personal activos en
                  el sistema.
                </p>
                <p>
                  Estado acepta solo &quot;Activo&quot; o &quot;Dado de
                  baja&quot; (vacio se interpreta como Activo).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fileInputId}>Archivo Excel</Label>
                <label
                  htmlFor={fileInputId}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-line-struct bg-subtle/40 px-4 py-3 transition-colors",
                    "hover:border-brand/60 hover:bg-brand/5",
                    file && "border-brand/50 bg-brand/5",
                  )}
                >
                  <FileSpreadsheet className="size-4 shrink-0 text-txt-muted transition-colors group-hover:text-brand" />
                  <span className="truncate text-sm text-txt-body">
                    {file ? file.name : "Seleccionar archivo .xlsx"}
                  </span>
                  <Input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_FILE}
                    className="sr-only"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setPreviewResult(null);
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handlePreview()}
                  disabled={!file || preview.isPending}
                >
                  <Upload className="size-4" />
                  {preview.isPending ? "Validando..." : "Validar archivo"}
                </Button>

                {previewResult ? (
                  <Button type="button" variant="outline" onClick={resetFlow}>
                    <RotateCcw className="size-4" />
                    Limpiar
                  </Button>
                ) : null}
              </div>
            </section>

            {previewResult ? (
              <section className="space-y-4">
                {previewResult.totalErrores > 0 ? (
                  <Alert variant="critical">
                    <CircleAlert className="size-4" />
                    <AlertTitle>La importacion tiene filas con error</AlertTitle>
                    <AlertDescription>
                      Corrige el archivo y volve a subirlo. Ningun usuario se
                      crea hasta que el lote quede sin errores.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="success">
                    <AlertTitle>Vista previa lista</AlertTitle>
                    <AlertDescription>
                      Todas las filas ({previewResult.totalRecords}) son
                      validas para importar.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">Total de filas</p>
                    <p className="mt-1 text-lg font-semibold text-txt-body">
                      {previewResult.totalRecords}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">Filas con error</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-lg font-semibold text-txt-body">
                        {previewResult.totalErrores}
                      </p>
                      <Badge
                        variant={
                          previewResult.totalErrores > 0
                            ? "critical"
                            : "secondary"
                        }
                      >
                        {previewResult.totalErrores > 0
                          ? "Con errores"
                          : "Sin errores"}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">
                      Usuarios creados
                    </p>
                    <p className="mt-1 text-lg font-semibold text-txt-body">
                      {previewResult.inserted}
                    </p>
                  </div>
                </div>

                <DataTable
                  columns={columns}
                  rows={pageRows}
                  minWidthClassName="min-w-[1440px]"
                  getRowKey={(row, index) => `${row.row}-${index}`}
                  getRowClassName={(row) =>
                    row.errors.length > 0
                      ? "bg-status-critical/5 hover:bg-status-critical/10"
                      : undefined
                  }
                  emptyTitle="Sin filas para mostrar"
                  emptyDescription="La vista previa no contiene filas procesadas."
                  pagination={{
                    page,
                    pageSize,
                    total: rows.length,
                    totalPages,
                    onPageChange: setPage,
                    onPageSizeChange: (nextPageSize) => {
                      setPageSize(nextPageSize);
                      setPage(1);
                    },
                  }}
                />
              </section>
            ) : null}
          </div>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">
              {previewResult && previewResult.totalErrores > 0
                ? "Hay filas con error: corrige el archivo y volve a subirlo. No se puede confirmar parcialmente."
                : "La importacion es todo-o-nada: si hay filas con error, no se crea ningun usuario."}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!canConfirm || confirmImport.isPending}
              >
                {confirmImport.isPending
                  ? "Importando..."
                  : "Confirmar e importar"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UserImportDialog;

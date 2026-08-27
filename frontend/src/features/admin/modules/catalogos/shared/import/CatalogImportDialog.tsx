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
import type {
  CatalogImportResponse,
  CatalogImportRow,
} from "@api/resources/catalogos/catalog-import.api";
import type { CatalogImportConfig } from "@features/admin/modules/catalogos/shared/import/catalog-import.config";
import { buildCatalogImportPreviewColumns } from "@features/admin/modules/catalogos/shared/import/buildCatalogImportPreviewColumns";
import { useCatalogImportConfirm } from "@features/admin/modules/catalogos/shared/import/useCatalogImportConfirm";
import { useCatalogImportPreview } from "@features/admin/modules/catalogos/shared/import/useCatalogImportPreview";
import { useCatalogTemplateDownload } from "@features/admin/modules/catalogos/shared/import/useCatalogTemplateDownload";

interface CatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CatalogImportConfig;
  onImported: () => void;
}

const ACCEPTED_FILES = ".xlsx,.xls";
const DEFAULT_PAGE_SIZE = 10;

export function CatalogImportDialog({
  open,
  onOpenChange,
  config,
  onImported,
}: CatalogImportDialogProps) {
  const fileInputId = useId();
  const preview = useCatalogImportPreview();
  const confirmImport = useCatalogImportConfirm();
  const { download, isDownloading } = useCatalogTemplateDownload(config);

  const [file, setFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] =
    useState<CatalogImportResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const columns = useMemo(
    () => buildCatalogImportPreviewColumns(config),
    [config],
  );

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
    if (!file || preview.isPending) {
      return;
    }

    try {
      const result = await preview.mutateAsync({ slug: config.slug, file });
      setPreviewResult(result);
      setPage(1);

      const validRows = result.total_records - result.total_errores;
      toast.success("Vista previa generada", {
        description:
          result.total_errores > 0
            ? `${validRows} filas validas y ${result.total_errores} con error.`
            : `${result.total_records} filas listas para importar.`,
      });
    } catch {
      toast.error("No se pudo procesar el archivo", {
        description: "Verifica el archivo e intenta nuevamente.",
      });
    }
  };

  const canConfirm =
    previewResult !== null &&
    previewResult.total_records > 0 &&
    previewResult.total_errores === 0;

  const handleConfirm = async () => {
    if (!file || !canConfirm || confirmImport.isPending) {
      return;
    }

    try {
      const result = await confirmImport.mutateAsync({
        slug: config.slug,
        file,
      });
      setPreviewResult(result);
      setPage(1);

      if (result.total_errores > 0) {
        toast.error("La importacion tiene filas con error", {
          description:
            "No se importo ningun registro. Corrige el archivo y vuelve a intentar.",
        });
        return;
      }

      toast.success("Importacion completada", {
        description: `${result.inserted} registros importados en ${config.catalogLabel}.`,
      });
      onImported();
      handleDialogOpenChange(false);
    } catch {
      toast.error("No se pudo confirmar la importacion", {
        description:
          "El catalogo no se actualizo. Revisa la vista previa e intenta nuevamente.",
      });
    }
  };

  const handleDownloadTemplate = () => {
    void download();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle>Importar {config.catalogLabel} desde Excel</DialogTitle>
            <DialogDescription>
              Descarga la plantilla, complétala y sube el archivo para
              previsualizar los registros antes de confirmar la importación.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8 pt-4">
            <section className="space-y-4 rounded-2xl border border-line-struct bg-paper p-4 sm:p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
              >
                <Download className="size-4" />
                {isDownloading ? "Descargando..." : "Descargar plantilla"}
              </Button>

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
                    {file ? file.name : "Seleccionar archivo .xlsx o .xls"}
                  </span>
                  <Input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_FILES}
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
                  onClick={() => {
                    void handlePreview();
                  }}
                  disabled={!file || preview.isPending}
                >
                  <Upload className="size-4" />
                  {preview.isPending ? "Procesando..." : "Previsualizar informacion"}
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
                {previewResult.total_errores > 0 ? (
                  <Alert variant="critical">
                    <CircleAlert className="size-4" />
                    <AlertTitle>La importacion tiene filas con error</AlertTitle>
                    <AlertDescription>
                      Corrige el archivo y vuelve a subirlo. Ninguna fila se
                      importa hasta que el lote quede sin errores.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="success">
                    <AlertTitle>Vista previa lista</AlertTitle>
                    <AlertDescription>
                      Todas las filas ({previewResult.total_records}) son
                      validas para importar.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">Total de filas</p>
                    <p className="mt-1 text-lg font-semibold text-txt-body">
                      {previewResult.total_records}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">Filas con error</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-lg font-semibold text-txt-body">
                        {previewResult.total_errores}
                      </p>
                      <Badge
                        variant={
                          previewResult.total_errores > 0
                            ? "critical"
                            : "secondary"
                        }
                      >
                        {previewResult.total_errores > 0
                          ? "Con errores"
                          : "Sin errores"}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3">
                    <p className="text-xs text-txt-muted">Registros importados</p>
                    <p className="mt-1 text-lg font-semibold text-txt-body">
                      {previewResult.inserted}
                    </p>
                  </div>
                </div>

                <DataTable<CatalogImportRow>
                  columns={columns}
                  rows={pageRows}
                  getRowKey={(row, index) => `${row.ID}-${index}`}
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
              La importacion es todo-o-nada: si hay filas con error, no se
              importa ningun registro.
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
                onClick={() => {
                  void handleConfirm();
                }}
                disabled={!canConfirm || confirmImport.isPending}
              >
                {confirmImport.isPending
                  ? "Importando..."
                  : "Confirmar importacion"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CatalogImportDialog;

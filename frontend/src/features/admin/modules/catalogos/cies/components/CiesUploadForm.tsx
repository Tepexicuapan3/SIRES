import { forwardRef, useId, useImperativeHandle, useState } from "react";
import { CircleAlert, FileSpreadsheet } from "lucide-react";
import type { CiesPreviewResponse } from "@api/resources/catalogos/cies.api";
import { useCiesPreview } from "@features/admin/modules/catalogos/cies/mutations/useCiesPreview";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/utils/styling/cn";

export type CiesUploadFormRef = {
  preview: () => Promise<CiesPreviewResponse | null>;
};

type UploadError = {
  title: string;
  message: string;
  variant: "warning" | "destructive";
};

const DEFAULT_VERSION = "CIE-10";
const ACCEPTED_FILES = ".xlsx,.xls";

export const CiesUploadForm = forwardRef<CiesUploadFormRef>((_, ref) => {
  const ciesPreview = useCiesPreview();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState(DEFAULT_VERSION);
  const [error, setError] = useState<UploadError | null>(null);
  const fileInputId = useId();
  const versionInputId = useId();

  const preview = async (): Promise<CiesPreviewResponse | null> => {
    if (!file) {
      setError({
        title: "Archivo requerido",
        message:
          "Selecciona un archivo Excel para continuar con la previsualizacion.",
        variant: "warning",
      });
      return null;
    }

    const normalizedVersion = version.trim();
    if (!normalizedVersion) {
      setError({
        title: "Version requerida",
        message:
          "Ingresa una version valida antes de generar la previsualizacion.",
        variant: "warning",
      });
      return null;
    }

    setError(null);

    try {
      return await ciesPreview.mutateAsync({
        file,
        version: normalizedVersion,
      });
    } catch {
      setError({
        title: "No se pudo previsualizar",
        message:
          "Ocurrio un error al procesar el archivo. Verifica el contenido e intenta nuevamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  useImperativeHandle(ref, () => ({ preview }));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
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
                setError(null);
              }}
            />
          </label>
          <p className="text-xs text-txt-muted">Maximo un archivo por carga.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={versionInputId}>Version</Label>
          <Input
            id={versionInputId}
            type="text"
            value={version}
            placeholder="CIE-10"
            onChange={(event) => {
              setVersion(event.target.value);
              setError(null);
            }}
          />
          <p className="text-xs text-txt-muted">Ejemplo: CIE-10 2025.</p>
        </div>
      </div>

      {error ? (
        <Alert variant={error.variant} className="rounded-xl">
          <CircleAlert className="size-4" />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
});

CiesUploadForm.displayName = "CiesUploadForm";

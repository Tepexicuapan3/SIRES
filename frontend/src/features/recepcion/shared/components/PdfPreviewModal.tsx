import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@shared/ui/dialog";

interface PdfPreviewModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  fetchPdf:     () => Promise<Blob>;
  filename:     string;
  title?:       string;
}

type LoadState = "idle" | "loading" | "ready" | "error";

export function PdfPreviewModal({
  open,
  onOpenChange,
  fetchPdf,
  filename,
  title = "Ficha de consulta",
}: PdfPreviewModalProps) {
  const [blobUrl,   setBlobUrl]   = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");

  const load = useCallback(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setLoadState("loading");
      setBlobUrl(null);
    });

    fetchPdf()
      .then((blob) => {
        if (cancelled) return;
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        setBlobUrl(URL.createObjectURL(pdfBlob));
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => { cancelled = true; };
  }, [fetchPdf]);

  useEffect(() => {
    if (!open) return;
    return load();
  }, [open, load]);

  useEffect(() => {
    if (!open && blobUrl) {
      const url = blobUrl;
      void Promise.resolve().then(() => {
        setBlobUrl(null);
        setLoadState("idle");
      });
      setTimeout(() => URL.revokeObjectURL(url), 300);
    }
  }, [open, blobUrl]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a    = document.createElement("a");
    a.href     = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col w-[92vw] max-w-3xl h-[88vh] p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Barra superior */}
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-line-struct px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-3.5 text-primary" />
            </div>
            <DialogTitle className="text-sm font-semibold text-txt-body truncate">
              {title}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {loadState === "error" ? (
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={load}>
                <RefreshCcw className="size-3.5" />
                Reintentar
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              onClick={handleDownload}
              disabled={loadState !== "ready"}
            >
              <Download className="size-3.5" />
              Descargar
            </Button>
          </div>
        </DialogHeader>

        {/* Área del PDF */}
        <div className="relative flex-1 min-h-0 bg-gray-100">
          {loadState === "loading" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-txt-muted">Generando ficha...</p>
            </div>
          ) : loadState === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <p className="text-sm font-semibold text-status-critical">No se pudo generar el PDF</p>
              <p className="text-xs text-txt-muted max-w-xs">
                Verifica que Microsoft Word esté instalado en el servidor.
              </p>
              <Button size="sm" onClick={load} className="gap-1.5 mt-1">
                <RefreshCcw className="size-3.5" />
                Reintentar
              </Button>
            </div>
          ) : blobUrl ? (
            <iframe
              key={blobUrl}
              src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="h-full w-full border-0"
              title="Vista previa de la ficha"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

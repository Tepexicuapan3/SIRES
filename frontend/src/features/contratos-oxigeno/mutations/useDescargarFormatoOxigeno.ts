import { useState } from "react";
import { contratosAPI } from "@api/resources/contratos.api";
import type { ContratoOxigeno } from "@api/types";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function useDescargarFormatoOxigeno() {
  const [isDownloading, setIsDownloading] = useState(false);

  const descargar = async (contrato: ContratoOxigeno) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await contratosAPI.descargarFormato(contrato.id);
      triggerDownload(blob, `formato_oxigeno_${contrato.numContrato}.docx`);
    } finally {
      setIsDownloading(false);
    }
  };

  return { descargar, isDownloading };
}

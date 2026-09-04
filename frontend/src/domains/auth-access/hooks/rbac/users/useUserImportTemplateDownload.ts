import { useState } from "react";
import { usersAPI } from "@api/resources/users.api";

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

/**
 * Descarga la plantilla .xlsx de importacion masiva de usuarios.
 */
export function useUserImportTemplateDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await usersAPI.import.downloadTemplate();
      triggerDownload(blob, "plantilla_usuarios.xlsx");
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}

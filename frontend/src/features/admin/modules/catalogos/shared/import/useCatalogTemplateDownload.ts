import { useState } from "react";
import { catalogImportAPI } from "@api/resources/catalogos/catalog-import.api";
import type { CatalogImportConfig } from "@features/admin/modules/catalogos/shared/import/catalog-import.config";

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

export function useCatalogTemplateDownload(config: CatalogImportConfig) {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await catalogImportAPI.downloadTemplate(config.slug);
      triggerDownload(blob, config.templateFilename);
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}
